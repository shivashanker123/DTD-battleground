import test from 'node:test';
import assert from 'node:assert/strict';
import { initialConnection, isConnectivityError, nextConnection, pollDelay } from './connection.js';

const T0 = 1_000_000;
const fail = (status) => ({ type: 'failure', error: { status } });
const ok = { type: 'success' };

test('two failed polls show the warning; the next success clears it', () => {
  let c = initialConnection(T0);
  c = nextConnection(c, fail(0), T0 + 1500);
  assert.equal(c.lost, false, 'one quick failure alone is not enough');
  c = nextConnection(c, fail(0), T0 + 3000);
  assert.equal(c.lost, true);
  c = nextConnection(c, ok, T0 + 4500);
  assert.deepEqual(c, { failures: 0, lastSuccessAt: T0 + 4500, lost: false });
});

test('a single poll that hangs until its 5 s timeout shows the warning', () => {
  let c = nextConnection(initialConnection(T0), ok, T0);
  c = nextConnection(c, fail(0), T0 + 5100);
  assert.equal(c.failures, 1);
  assert.equal(c.lost, true);
});

test('401 means signed out, not disconnected; other 4xx are ignored too', () => {
  let c = initialConnection(T0);
  for (const status of [401, 401, 404, 409, 429]) c = nextConnection(c, fail(status), T0 + 9000);
  assert.deepEqual(c, initialConnection(T0));
  assert.equal(isConnectivityError({ status: 401 }), false);
});

test('network errors, timeouts and 5xx (including busy 503) count as connectivity problems', () => {
  for (const status of [0, 500, 502, 503]) assert.equal(isConnectivityError({ status }), true, String(status));
  assert.equal(isConnectivityError(new TypeError('failed to fetch')), true);
  let c = initialConnection(T0);
  c = nextConnection(c, fail(503), T0 + 100);
  c = nextConnection(c, fail(503), T0 + 200);
  assert.equal(c.lost, true);
});

test('waking the phone starts a fresh window instead of flashing the warning', () => {
  let c = initialConnection(T0);
  c = nextConnection(c, { type: 'resumed' }, T0 + 10 * 60_000);
  c = nextConnection(c, fail(0), T0 + 10 * 60_000 + 200);
  assert.equal(c.lost, false);
});

test('waking the phone does not clear a warning that is already showing', () => {
  let c = initialConnection(T0);
  c = nextConnection(c, fail(0), T0 + 100);
  c = nextConnection(c, fail(0), T0 + 200);
  c = nextConnection(c, { type: 'resumed' }, T0 + 60_000);
  assert.equal(c.lost, true, 'only a successful poll clears it');
  c = nextConnection(c, { type: 'success' }, T0 + 61_000);
  assert.equal(c.lost, false);
});

test('polling backs off gently while failing and never goes past 5 s', () => {
  assert.equal(pollDelay(1500, 0), 1500);
  assert.equal(pollDelay(1500, 1), 1500);
  assert.equal(pollDelay(1500, 2), 3000);
  assert.equal(pollDelay(1500, 3), 5000);
  assert.equal(pollDelay(1500, 10), 5000);
  assert.equal(pollDelay(700, 4), 5000);
  assert.equal(pollDelay(700, 2), 1400);
});
