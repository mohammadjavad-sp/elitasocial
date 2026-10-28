"use strict";

// Production startup file for cPanel's Phusion Passenger integration.
async function start() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 19)) {
    throw new Error("Elita Social requires Node.js 22.19.0 or newer.");
  }

  process.env.NODE_ENV = "production";
  process.chdir(__dirname);

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
