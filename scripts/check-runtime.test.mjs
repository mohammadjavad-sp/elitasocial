import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
async function fixture(passenger = false) {
  const process = Object.assign(new EventEmitter(), { env: {}, versions: { node: '22.18.0' }, chdir() {}, exit(code) { exits.push(code); } });
  const exits = [], deadlines = [], calls = { sharp: [], close: 0, nextClose: 0, idle: 0, all: 0, listen: null, passenger: null };
  let completeClose;
  const server = Object.assign(new EventEmitter(), {
    listen(value) { calls.listen = value; },
    close(callback) { calls.close++; completeClose = callback; },
    closeIdleConnections() { calls.idle++; },
    closeAllConnections() { calls.all++; },
  });
  const app = { async prepare() {}, getRequestHandler() { return async () => {}; }, async close() { calls.nextClose++; } };
  runInNewContext(source, {
    __dirname: '/fixture', process, console: { error() {} },
    PhusionPassenger: passenger ? { configure(value) { calls.passenger = value.autoInstall; } } : undefined,
    setTimeout(callback, delay) { const timer = { callback, delay, unref() {} }; deadlines.push(timer); return timer; },
    require(name) {
      if (name === 'node:http') return { createServer() { return server; } };
      if (name === 'next') return () => app;
      if (name === 'sharp') return { concurrency(value) { calls.sharp.push(value); } };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  await new Promise(resolve => setImmediate(resolve));
  return { process, server, calls, exits, deadlines, finish: () => completeClose() };
}

test('startup preserves Passenger integration and bounds image workers before Next', async () => {
  const f = await fixture(true);
  assert.equal(f.calls.passenger, false);
  assert.equal(f.calls.listen, 'passenger');
  assert.deepEqual(f.calls.sharp, [1]);
  for (const name of ['UV_THREADPOOL_SIZE','VIPS_CONCURRENCY','RAYON_NUM_THREADS']) assert.equal(f.process.env[name], '1');
  assert.equal(f.process.env.NODE_OPTIONS, undefined);
});

test('shutdown waits for requests, handles repeated signals once, then closes Next', async () => {
  const f = await fixture();
  f.process.emit('SIGTERM'); f.process.emit('SIGINT');
  assert.equal(f.calls.close, 1);
  assert.equal(f.calls.idle, 1);
  assert.deepEqual(f.exits, []);
  f.finish();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.calls.nextClose, 1);
  assert.deepEqual(f.exits, [0]);
});

test('stuck requests cannot retain an old process beyond the shutdown deadline', async () => {
  const f = await fixture();
  f.process.emit('SIGTERM');
  assert.equal(f.deadlines.length, 1);
  assert.equal(f.deadlines[0].delay, 10_000);
  f.deadlines[0].callback();
  assert.equal(f.calls.all, 1);
  assert.deepEqual(f.exits, [0]);
});
