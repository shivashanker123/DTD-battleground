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
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dataDir,
      ADMIN_PASSWORD,
      QUESTIONS_FILE: path.join(ROOT, 'server/questions.sample.json')
    },
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

// Two teams where qualification order (Zeta first) differs from alphabetical order (Alpha first),
// so any leak of qualification order shows up in the tests below.
async function twoTeamEvent(srv) {
  const admin = await srv.adminToken();
  const zeta = (await srv.call('POST', '/register', { teamName: 'Zeta', passcode: 'pass1234', member: 'Z' })).body.token;
  const alpha = (await srv.call('POST', '/register', { teamName: 'Alpha', passcode: 'pass1234', member: 'A' })).body.token;
  await srv.call('POST', '/admin/phase', { phase: 'round1' }, admin);
  await srv.call('POST', '/r1/open', { questionId: 'r1-01' }, zeta);
  assert.equal((await srv.call('POST', '/r1/submit', { questionId: 'r1-01', answer: 42 }, zeta)).body.correct, true);
  const ids = Object.fromEntries(
    (await srv.call('GET', '/admin/state', undefined, admin)).body.teams.map((t) => [t.name, t.id])
  );
  return { admin, zeta, alpha, ids };
}

const hiddenStandings = (view) =>
  view.standingsPublished === false &&
  view.standings.qualification.length === 0 &&
  view.standings.round1.length === 0 &&
  view.standings.round2.length === 0;

test('standings are hidden from visitors and teams by default, but not from organisers', async () => {
  const dir = tempDir();
  const srv = await startServer(dir);
  try {
    const { admin, zeta, alpha } = await twoTeamEvent(srv);

    const visitor = (await srv.call('GET', '/state')).body;
    assert.ok(hiddenStandings(visitor));
    assert.deepEqual(visitor.standings.final, []);
    assert.deepEqual(visitor.finalists, []);
    assert.ok(!JSON.stringify(visitor).includes('Zeta'), 'no team names reach visitors');

    const alphaView = (await srv.call('GET', '/state', undefined, alpha)).body;
    assert.ok(hiddenStandings(alphaView));
    assert.ok(!JSON.stringify(alphaView).includes('Zeta'), 'a team never sees another team');
    assert.equal(alphaView.myScores.total, 0);

    const zetaView = (await srv.call('GET', '/state', undefined, zeta)).body;
    assert.equal(zetaView.myScores.r1.points, 50, 'a team still sees its own score');
    assert.equal(zetaView.myScores.rank, undefined);
    assert.ok(!JSON.stringify(zetaView.myScores).includes('rank'));

    const adminView = (await srv.call('GET', '/admin/state', undefined, admin)).body;
    assert.equal(adminView.standingsPublished, false);
    assert.deepEqual(adminView.standings.qualification.map((r) => [r.name, r.rank]), [['Zeta', 1], ['Alpha', 2]]);
  } finally {
    await srv.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('organisers can publish and hide standings; nobody else can', async () => {
  const dir = tempDir();
  const srv = await startServer(dir);
  try {
    const { admin, alpha } = await twoTeamEvent(srv);
    assert.equal((await srv.call('POST', '/admin/standings-visibility', { published: true })).status, 401);
    assert.equal((await srv.call('POST', '/admin/standings-visibility', { published: true }, alpha)).status, 401);
    assert.equal((await srv.call('POST', '/admin/standings-visibility', { published: 'yes' }, admin)).status, 400);
    assert.ok(hiddenStandings((await srv.call('GET', '/state')).body));

    assert.equal((await srv.call('POST', '/admin/standings-visibility', { published: true }, admin)).status, 200);
    const shown = (await srv.call('GET', '/state', undefined, alpha)).body;
    assert.equal(shown.standingsPublished, true);
    assert.deepEqual(shown.standings.qualification.map((r) => r.name), ['Zeta', 'Alpha']);

    assert.equal((await srv.call('POST', '/admin/standings-visibility', { published: false }, admin)).status, 200);
    assert.ok(hiddenStandings((await srv.call('GET', '/state')).body));
  } finally {
    await srv.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('visibility survives a restart, and older save files start hidden', async () => {
  const dir = tempDir();
  let srv = await startServer(dir);
  try {
    const admin = await srv.adminToken();
    await srv.call('POST', '/admin/standings-visibility', { published: true }, admin);
    await srv.stop('SIGKILL');
    srv = await startServer(dir);
    assert.equal((await srv.call('GET', '/state')).body.standingsPublished, true);
    await srv.stop();

    // Simulate a save file written before this feature existed.
    const file = path.join(dir, 'state.json');
    const legacy = JSON.parse(fs.readFileSync(file, 'utf8'));
    delete legacy.standingsPublished;
    fs.writeFileSync(file, JSON.stringify(legacy));
    srv = await startServer(dir);
    assert.ok(hiddenStandings((await srv.call('GET', '/state')).body));
  } finally {
    await srv.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('starting the final reveals finalists and live scores without leaking qualification order', async () => {
  const dir = tempDir();
  const srv = await startServer(dir);
  try {
    const { admin, ids } = await twoTeamEvent(srv);
    await srv.call('POST', '/admin/phase', { phase: 'round2_closed' }, admin);
    assert.equal((await srv.call('POST', '/admin/finalists', {}, admin)).status, 200);

    const beforeFinal = (await srv.call('GET', '/state')).body;
    assert.deepEqual(beforeFinal.finalists, [], 'locked finalists stay private until Round 3 starts');
    assert.deepEqual(beforeFinal.standings.final, []);

    await srv.call('POST', '/admin/phase', { phase: 'round3' }, admin);
    const live = (await srv.call('GET', '/state')).body;
    assert.ok(hiddenStandings(live), 'Round 1/2 rankings stay hidden');
    assert.deepEqual(live.finalists, [ids.Alpha, ids.Zeta], 'finalists listed alphabetically, not by qualification');
    assert.deepEqual(
      live.standings.final.map((r) => [r.name, r.score, r.rank, r.tied]),
      [['Alpha', 0, 1, true], ['Zeta', 0, 1, true]]
    );
    assert.ok(live.standings.final.every((r) => r.qualifierRank === undefined));

    const adminView = (await srv.call('GET', '/admin/state', undefined, admin)).body;
    assert.deepEqual(adminView.finalists, [ids.Zeta, ids.Alpha], 'organisers keep qualifying order');
    assert.deepEqual(adminView.standings.final.map((r) => r.qualifierRank), [1, 2]);

    await srv.call('POST', '/admin/standings-visibility', { published: true }, admin);
    const published = (await srv.call('GET', '/state')).body;
    assert.deepEqual(published.finalists, [ids.Zeta, ids.Alpha]);
    assert.deepEqual(published.standings.final.map((r) => r.qualifierRank), [1, 2]);
  } finally {
    await srv.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('built-in object property names are never accepted as admin or team tokens', async () => {
  const dir = tempDir();
  const srv = await startServer(dir);
  try {
    for (const token of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
      assert.equal((await srv.call('GET', '/admin/state', undefined, token)).status, 401, token);
      assert.equal((await srv.call('GET', '/admin/backup', undefined, token)).status, 401, token);
      assert.equal((await srv.call('POST', '/admin/standings-visibility', { published: true }, token)).status, 401, token);
      assert.equal((await srv.call('POST', '/logout', {}, token)).status, 401, token);
    }
    assert.equal((await srv.call('GET', '/constructor')).status, 404);
  } finally {
    await srv.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('while standings are hidden, the public final board still follows sudden-death results', async () => {
  const dir = tempDir();
  const srv = await startServer(dir);
  try {
    const { admin, ids } = await twoTeamEvent(srv);
    await srv.call('POST', '/admin/phase', { phase: 'round2_closed' }, admin);
    await srv.call('POST', '/admin/finalists', {}, admin);
    await srv.call('POST', '/admin/phase', { phase: 'round3' }, admin);
    // Both finalists on 0; Zeta wins a sudden-death question.
    assert.equal((await srv.call('POST', '/admin/sudden-death', { scope: 'final', teamId: ids.Zeta }, admin)).status, 200);
    const live = (await srv.call('GET', '/state')).body;
    assert.deepEqual(
      live.standings.final.map((r) => [r.name, r.rank, r.tied]),
      [['Zeta', 1, false], ['Alpha', 2, false]]
    );
    assert.ok(hiddenStandings(live));
  } finally {
    await srv.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
