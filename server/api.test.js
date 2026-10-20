// API-level tests: run the real server as a child process against a throwaway data folder.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_PASSWORD = 'api-test-admin';
let nextPort = 41000 + (process.pid % 2000) * 4;

async function startServer(dataDir) {
  const port = nextPort++;
  const proc = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, ADMIN_PASSWORD },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  let stderr = '';
  proc.stderr.on('data', (d) => (stderr += d));
  const base = `http://127.0.0.1:${port}/api`;
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(`${base}/state`);
      break;
    } catch {
      if (proc.exitCode !== null) throw new Error(`server exited early:\n${stderr}`);
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  const call = async (method, p, body, token) => {
    const res = await fetch(base + p, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  const stop = (signal = 'SIGTERM') =>
    new Promise((resolve) => {
      if (proc.exitCode !== null) return resolve();
      proc.once('exit', resolve);
      proc.kill(signal);
    });
  const adminToken = async () => (await call('POST', '/admin/login', { password: ADMIN_PASSWORD })).body.token;
  return { call, stop, adminToken };
}

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'dtd-api-test-'));

test('a change answered with OK survives an immediate hard crash', async () => {
  const dir = tempDir();
  let srv = await startServer(dir);
  try {
    const admin = await srv.adminToken();
    const { body: reg } = await srv.call('POST', '/register', { teamName: 'Durable', passcode: 'pass1234', member: 'A' });
    assert.equal((await srv.call('POST', '/admin/phase', { phase: 'round2_buy' }, admin)).status, 200);
    const buy = await srv.call('POST', '/r2/buy', { questionId: 'r2-h01' }, reg.token);
    assert.equal(buy.status, 200);
    await srv.stop('SIGKILL'); // no chance to flush on exit

    srv = await startServer(dir);
    const backup = (await srv.call('GET', '/admin/backup', undefined, await srv.adminToken())).body;
    const team = Object.values(backup.teams).find((t) => t.name === 'Durable');
    assert.ok(team, 'team was saved');
    assert.ok(backup.r2[team.id]?.purchases?.['r2-h01'], 'purchase answered with OK was saved before the reply');
  } finally {
    await srv.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
