"use strict";

// Production startup file for cPanel's Phusion Passenger integration.
async function start() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 18)) {
    throw new Error("Elita Social requires Node.js 22.18.0 or newer.");
  }

  process.env.NODE_ENV = "production";
  process.chdir(__dirname);

  // Native libraries on shared hosts must not size their pools from all host CPUs.
  // Also set these in cPanel: Node/libuv can initialise before this file is loaded.
  process.env.UV_THREADPOOL_SIZE ||= "1";
  process.env.VIPS_CONCURRENCY = "1";
  process.env.RAYON_NUM_THREADS ||= "1";
  require("sharp").concurrency(1);

  const passenger = typeof PhusionPassenger !== "undefined" ? PhusionPassenger : null;
  if (passenger) {
    // Next may create internal servers; select our public server explicitly.
    passenger.configure({ autoInstall: false });
  }

  const { createServer } = require("node:http");
  const next = require("next");
  const app = next({ dev: false, dir: __dirname });
  await app.prepare();

  const handle = app.getRequestHandler();
  const server = createServer(async (request, response) => {
    try {
      await handle(request, response);
    } catch (error) {
      console.error("Elita Social request failed:", error instanceof Error ? error.message : "Unknown request error.");
      if (!response.headersSent) {
        response.statusCode = 500;
        response.end("Internal Server Error");
      } else {
        response.destroy();
      }
    }
  });
  server.on("error", (error) => {
    console.error("Elita Social HTTP server failed:", error.message);
    process.exit(1);
  });

  let stopping = false;
  function shutdown() {
    if (stopping) return;
    stopping = true;
    // Finish active requests, but do not keep an old process alive indefinitely.
    const deadline = setTimeout(() => {
      server.closeAllConnections?.();
      process.exit(0);
    }, 10_000);
    deadline.unref();
    server.close(() => {
      Promise.resolve().then(() => app.close()).then(
        () => process.exit(0),
        () => process.exit(1),
      );
    });
    server.closeIdleConnections?.();
  }
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  if (passenger) {
    server.listen("passenger");
  } else {
    server.listen(Number(process.env.PORT || 3000));
  }
}

start().catch((error) => {
  console.error("Elita Social could not start:", error instanceof Error ? error.message : "Unknown startup error.");
  process.exit(1);
});
