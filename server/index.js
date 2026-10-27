// DTD Battleground server: owns timers, access, answer checking and totals.
// State is persisted in short, serialized batches so a registration rush cannot freeze the event loop,
// and every change is on disk before its request is answered.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as game from './game.js';
import { loadQuestions } from './questions.js';

const here = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile();
} catch {}
const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(here, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const DIST_DIR = path.join(here, '..', 'dist');

let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = crypto.randomBytes(6).toString('hex');
  console.warn(`ADMIN_PASSWORD is not set. Using a one-time password for this run: ${ADMIN_PASSWORD}`);
}

// ---------- state persistence ----------

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return game.createState();
  const loaded = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  // Save files from before standings could be hidden start hidden, like a new event.
  if (typeof loaded.standingsPublished !== 'boolean') loaded.standingsPublished = false;
  return loaded;
}

// Short batching window: long enough to merge a burst of changes into one write, short enough
// that requests (which wait for the save before replying) stay snappy.
const SAVE_DEBOUNCE_MS = 50;
const SAVE_RETRY_BASE_MS = 1_000;
const SAVE_RETRY_MAX_MS = 30_000;
let saveRequested = false;
let saveTimer = null;
let saveRetryTimer = null;
let saveRunning = null;
let saveSequence = 0;
// Requests waiting for the next write that will contain their change.
let saveWaiters = [];
const persistence = {
  status: 'healthy',
  consecutiveFailures: 0,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastError: null,
  nextRetryAt: null
};

function scheduleFlush(delay) {
  if (saveTimer || saveRetryTimer || saveRunning) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void flushState();
  }, delay);
}

function scheduleRetry() {
  const delay = Math.min(SAVE_RETRY_BASE_MS * 2 ** (persistence.consecutiveFailures - 1), SAVE_RETRY_MAX_MS);
  persistence.nextRetryAt = Date.now() + delay;
  saveRetryTimer = setTimeout(() => {
    saveRetryTimer = null;
    persistence.nextRetryAt = null;
    if (saveRequested) scheduleFlush(0);
  }, delay);
}

// Coalesce a burst of mutations into one latest-state snapshot. Only one writer may run at a
// time; otherwise an older write could complete after a newer one and overwrite it.
// Returns a promise that settles once a write containing this change has finished, so a request
// can reply "OK" only when the change is on disk ("group commit"). While the disk is failing we
// do not make requests wait for retries: they are answered from memory and the console shows the
// degraded-persistence warning.
function saveState() {
  saveRequested = true;
  scheduleFlush(SAVE_DEBOUNCE_MS);
  if (persistence.status === 'degraded') return Promise.resolve();
  return new Promise((resolve) => saveWaiters.push(resolve));
}

function releaseWaiters(waiters) {
  for (const resolve of waiters) resolve();
}

async function flushState() {
  if (saveRunning) return saveRunning;
  if (!saveRequested) return;

  saveRequested = false;
  // Everyone who asked for a save up to this point is covered by this snapshot.
  const waiters = saveWaiters;
  saveWaiters = [];
  const snapshot = JSON.stringify(state);
  const tmp = `${STATE_FILE}.${process.pid}.${++saveSequence}.tmp`;
  saveRunning = (async () => {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    await fs.promises.writeFile(tmp, snapshot);
    await fs.promises.rename(tmp, STATE_FILE); // atomic replace: never leaves a partial state file
  })();

  try {
    await saveRunning;
    persistence.status = 'healthy';
    persistence.consecutiveFailures = 0;
    persistence.lastSuccessAt = Date.now();
    persistence.lastError = null;
    persistence.nextRetryAt = null;
  } catch (err) {
    // Keep the state dirty so a later retry persists the latest in-memory snapshot. The existing
    // state file is untouched because the atomic rename runs only after a successful temp write.
    saveRequested = true;
    persistence.status = 'degraded';
    persistence.consecutiveFailures += 1;
    persistence.lastFailureAt = Date.now();
    persistence.lastError = err instanceof Error ? err.message : String(err);
    console.error('Could not persist game state:', err);
  } finally {
    saveRunning = null;
    releaseWaiters(waiters);
    if (saveRequested) {
      if (persistence.status === 'degraded') scheduleRetry();
      else scheduleFlush(SAVE_DEBOUNCE_MS);
    }
  }
}

async function flushStateBeforeExit() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (saveRetryTimer) {
    clearTimeout(saveRetryTimer);
    saveRetryTimer = null;
  }
  if (saveRunning) await saveRunning.catch(() => {});
  if (saveRequested) await flushState();
  if (saveRetryTimer) {
    clearTimeout(saveRetryTimer);
    saveRetryTimer = null;
  }
  if (saveRequested) {
    console.error('State has not been persisted; fix the disk error before restarting the server.');
  }
  releaseWaiters(saveWaiters);
  saveWaiters = [];
}

let state = loadState();
let shuttingDown = false;
const questions = loadQuestions(here, state.config);
if (questions.isSample) console.warn('Using SAMPLE questions. Put the real bank in server/questions.json.');
for (const w of questions.warnings) console.warn(`Question bank: ${w}`);

// Closes timed phases even when nobody is polling.
setInterval(() => {
  if (game.tick(state, Date.now())) saveState();
}, 500);

// ---------- views: what each audience may see ----------

const publicQuestion = (q) => ({ prompt: q.prompt, code: q.code, type: q.type, options: q.options });
// Stand-in if the question file changed mid-event, so live screens never break.
const MISSING_QUESTION = { prompt: '(This question is no longer in the question file.)', type: 'numeric' };
const teamName = (id) => state.teams[id]?.name ?? 'Removed team';

function publicR3(now) {
  const { r3 } = state;
  const cur = r3.current;
  let current = null;
  if (cur) {
    const q = questions.bank.round3.find((x) => x.id === cur.questionId) ?? MISSING_QUESTION;
    current = {
      number: game.questionNumber(state),
      practice: Boolean(cur.practice),
      status: cur.status,
      ...publicQuestion(q),
      buzzes: cur.buzzes.map((b, i) => ({
        position: i + 1,
        teamId: b.teamId,
        teamName: teamName(b.teamId),
        afterMs: cur.openedAt ? b.at - cur.openedAt : null
      })),
      attempts: cur.attempts.map((id) => ({ teamId: id, teamName: teamName(id) })),
      answering: cur.answering && { ...cur.answering, teamName: teamName(cur.answering.teamId) },
      winner: cur.winner && { teamId: cur.winner, teamName: teamName(cur.winner) },
      // The answer is revealed on screen once the question is over.
      answer: ['done', 'void'].includes(cur.status) ? q.answer : undefined
    };
  }
  return {
    current,
    played: r3.history.filter((h) => h.status !== 'void' && !h.practice).length,
    recentLog: r3.log.slice(-8).reverse().map((l) => ({ ...l, teamName: teamName(l.teamId) })),
    serverNow: now
  };
}

// Round 1 tiles, or the practice round's tiles (same rules, separate questions, never scored).
function teamSprint(team, now, kind) {
  const list = kind === 'practice' ? (questions.bank.practice ?? []) : questions.bank.round1;
  const recs = (kind === 'practice' ? state.practice?.[team.id] : state.r1[team.id]) ?? {};
  return list.map((q, i) => {
    const rec = recs[q.id];
    const status = game.r1Status(state, rec, now, kind);
    return {
      id: q.id,
      number: i + 1,
      status,
      openedAt: rec?.openedAt,
      deadline: rec && game.r1Deadline(state, rec, kind),
      answeredBy: rec?.by,
      // Question text stays hidden until opened and disappears again once the attempt is over.
      ...(status === 'active' ? { domain: q.domain, ...publicQuestion(q) } : {})
    };
  });
}

function teamRound2(team) {
  const { phase } = state;
  const purchases = state.r2[team.id]?.purchases ?? {};
  const canRead = ['round2_solve', 'round2_closed', 'round3', 'finished'].includes(phase);
  return {
    coinsLeft: state.config.r2.startCoins - game.r2Spent(state, team.id),
    counts: Object.fromEntries(
      Object.keys(state.config.r2.levels).map((lvl) => [lvl, game.r2LevelCount(state, team.id, lvl)])
    ),
    catalog: questions.bank.round2.map((q) => {
      const p = purchases[q.id];
      return {
        id: q.id,
        level: q.level,
        domain: q.domain,
        owned: Boolean(p),
        ...(p && {
          cost: p.cost,
          points: p.points,
          answered: Boolean(p.submittedAt),
          correct: p.submittedAt ? p.correct : undefined,
          answeredBy: p.by && p.submittedAt ? p.by : undefined
        }),
        ...(p && canRead ? publicQuestion(q) : {})
      };
    })
  };
}

// Final standings safe to show while earlier rankings are hidden: ranked by final score only, ties share a
// rank and are listed alphabetically, and the qualifier rank (the stored tie-break) is left out. Otherwise,
// with every finalist on 0 at the start, the board order would reveal the qualification ranking.
// Sudden-death results in the final are public results, so they still break ties here.
function scoreOnlyFinal(rows) {
  const sd = (row) => state.suddenDeath.final?.[row.teamId] ?? Infinity;
  const level = (a, b) => a.score === b.score && sd(a) === sd(b);
  const sorted = rows
    .map(({ qualifierRank: _qualifierRank, ...row }) => row)
    .sort((a, b) => b.score - a.score || sd(a) - sd(b) || a.name.localeCompare(b.name) || a.teamId.localeCompare(b.teamId));
  return sorted.map((row, i) => ({
    ...row,
    rank: sorted.findIndex((r) => level(r, row)) + 1,
    tied: sorted.some((r, j) => j !== i && level(r, row))
  }));
}

// What teams, visitors and the projector may see. While standings are hidden (the default), no Round 1,
// Round 2 or qualification rankings leave the server: a signed-in team gets only its own scores. Starting
// Round 3 makes the finalist list and live final scores public; publishing reveals everything.
function publicState(session, now) {
  const { phase, config } = state;
  const published = state.standingsPublished === true;
  const finalStarted = ['round3', 'finished'].includes(phase);
  const showFinal = published || finalStarted;
  const standings = game.computeStandings(state);
  const strip = (rows) => rows.map(({ members: _members, ...row }) => row);
  const finalists = state.r3.finalists.filter((id) => state.teams[id]);
  const view = {
    serverNow: now,
    phase,
    timers: state.timers,
    registrationOpen: ['registration', 'practice'].includes(phase) || state.lateRegistration,
    config: { maxTeamSize: config.maxTeamSize, r1: config.r1, r2: config.r2, r3: config.r3 },
    counts: { round1: questions.bank.round1.length, teams: Object.keys(state.teams).length },
    standingsPublished: published,
    standings: {
      qualification: published ? strip(standings.qualification) : [],
      round1: published ? strip(standings.round1) : [],
      round2: published ? strip(standings.round2) : [],
      final: showFinal ? (published ? standings.final : scoreOnlyFinal(standings.final)) : []
    },
    // Stored in qualifying order, so only shown in that order once standings are public.
    finalists: !showFinal
      ? []
      : published
        ? finalists
        : [...finalists].sort((a, b) => state.teams[a].name.localeCompare(state.teams[b].name)),
    round3: ['round3', 'finished'].includes(phase) ? publicR3(now) : null,
    me: null
  };
  if (session) {
    const { team, member } = session;
    view.me = { teamId: team.id, teamName: team.name, member, members: team.members };
    // The team's own results, always visible to it; no ranks, so nothing about other teams leaks.
    const mine = standings.qualification.find((r) => r.teamId === team.id);
    view.myScores = mine && {
      r1: { points: mine.r1.points, correct: mine.r1.correct, attempted: mine.r1.attempted, timeMs: mine.r1.timeMs },
      r2: { points: mine.r2.points, correct: mine.r2.correct, bought: mine.r2.bought, coinsSpent: mine.r2.coinsSpent },
      total: mine.total
    };
    if (phase === 'practice') view.practice = teamSprint(team, now, 'practice');
    else if (phase !== 'registration') view.round1 = teamSprint(team, now, 'round1');
    if (PHASES_FROM_R2.includes(phase)) view.round2 = teamRound2(team);
  }
  return view;
}
const PHASES_FROM_R2 = game.PHASES.slice(game.PHASES.indexOf('round2_buy'));

function adminState(now) {
  const standings = game.computeStandings(state);
  const sessionsByTeam = {};
  for (const s of Object.values(state.sessions)) {
    (sessionsByTeam[s.teamId] ??= []).push(s.member);
  }
  return {
    ...publicState(null, now),
    standings,
    finalists: state.r3.finalists,
    lateRegistration: state.lateRegistration,
    teams: Object.values(state.teams).map((t) => ({
      id: t.id,
      name: t.name,
      members: t.members,
      online: sessionsByTeam[t.id] ?? [],
      createdAt: t.createdAt
    })),
    adjustments: state.adjustments.map((a) => ({ ...a, teamName: teamName(a.teamId) })),
    suddenDeath: state.suddenDeath,
    r3: { ...state.r3, log: state.r3.log.map((l) => ({ ...l, teamName: teamName(l.teamId) })) },
    round3: publicR3(now),
    questions: questions.bank,
    questionFile: path.relative(process.cwd(), questions.file),
    questionWarnings: questions.warnings,
    isSampleQuestions: questions.isSample,
    persistence: { ...persistence, savePending: Boolean(saveRequested || saveRunning || saveTimer || saveRetryTimer) }
  };
}

function standingsCsv() {
  const { qualification, final } = game.computeStandings(state);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    ['Rank', 'Team', 'Members', 'R1 points', 'R1 correct', 'R1 time (s)', 'R2 points', 'R2 coins spent', 'R2 last correct', 'Total', 'Tied'].join(',')
  ];
  for (const r of qualification) {
    lines.push(
      [
        r.rank,
        esc(r.name),
        esc(r.members.join('; ')),
        r.r1.points,
        r.r1.correct,
        (r.r1.timeMs / 1000).toFixed(1),
        r.r2.points,
        r.r2.coinsSpent,
        r.r2.lastCorrectAt ? new Date(r.r2.lastCorrectAt).toISOString() : '',
        r.total,
        r.tied ? 'yes' : ''
      ].join(',')
    );
  }
  if (final.length) {
    lines.push('', ['Final rank', 'Team', 'Final score', 'Qualifier rank'].join(','));
    for (const r of final) lines.push([r.rank, esc(r.name), r.score, r.qualifierRank].join(','));
  }
  return lines.join('\n');
}

// ---------- routes ----------

const team = (fn) => ({ auth: 'team', fn });
const admin = (fn) => ({ auth: 'admin', fn });
const open = (fn) => ({ auth: 'none', fn });

const routes = {
  'GET /api/state': open(({ session, now }) => publicState(session, now)),

  'POST /api/register': open(async ({ body, now }) => {
    const { token } = await game.registerTeamAsync(state, body, now);
    return { token };
  }),
  'POST /api/login': {
    ...open(async ({ body, now }) => {
      const { token, replaced } = await game.loginTeamAsync(state, body, now);
      return { token, replaced };
    }),
    limitKey: (body) => `team:${game.cleanName(body.teamName).toLowerCase()}`
  },
  'POST /api/logout': team(({ token }) => game.logout(state, token)),

  'POST /api/practice/open': team(({ session, body, now }) => {
    game.openR1(state, questions.bank, session.team, body.questionId, now, 'practice');
  }),
  'POST /api/practice/submit': team(({ session, body, now }) =>
    game.submitR1(state, questions.bank, session.team, session.member, body.questionId, body.answer, now, 'practice')
  ),
  'POST /api/r1/open': team(({ session, body, now }) => {
    game.openR1(state, questions.bank, session.team, body.questionId, now);
  }),
  'POST /api/r1/submit': team(({ session, body, now }) =>
    game.submitR1(state, questions.bank, session.team, session.member, body.questionId, body.answer, now)
  ),
  'POST /api/r2/buy': team(({ session, body, now }) => {
    game.buyR2(state, questions.bank, session.team, session.member, body.questionId, now);
  }),
  'POST /api/r2/return': team(({ session, body, now }) => game.returnR2(state, session.team, body.questionId, now)),
  'POST /api/r2/submit': team(({ session, body, now }) =>
    game.submitR2(state, questions.bank, session.team, session.member, body.questionId, body.answer, now)
  ),
  'POST /api/r3/buzz': team(({ session, now }) => game.buzz(state, session.team, now)),

  'POST /api/admin/login': {
    limitKey: () => 'admin',
    ...open(({ body, now }) => {
    const given = Buffer.from(String(body.password ?? ''));
    const expected = Buffer.from(ADMIN_PASSWORD);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      throw new game.GameError('Wrong admin password.', 401);
    }
    const token = crypto.randomBytes(24).toString('hex');
    state.adminSessions[token] = { createdAt: now };
    return { token };
  })
  },
  'POST /api/admin/logout': admin(({ token }) => {
    delete state.adminSessions[token];
  }),
  'GET /api/admin/state': admin(({ now }) => adminState(now)),
  'GET /api/admin/standings.csv': admin(() => ({ csv: standingsCsv() })),
  'POST /api/admin/standings-visibility': admin(({ body }) => game.setStandingsVisibility(state, body.published)),
  'GET /api/admin/backup': admin(() => ({ download: state })),

  'POST /api/admin/phase': admin(({ body, now }) => game.setPhase(state, body.phase, now)),
  'POST /api/admin/extend': admin(({ body }) => game.extendPhase(state, body.seconds)),
  'POST /api/admin/late-registration': admin(({ body }) => {
    state.lateRegistration = Boolean(body.enabled);
  }),
  'POST /api/admin/r2-cost': admin(({ body }) => {
    const level = state.config.r2.levels[body.level];
    const cost = Number(body.cost);
    if (!level) throw new game.GameError('Unknown level.');
    if (!Number.isInteger(cost) || cost < 1) throw new game.GameError('Cost must be a whole number of coins.');
    if (game.PHASES.indexOf(state.phase) >= game.PHASES.indexOf('round2_buy')) {
      throw new game.GameError('Prices are locked once the market has opened.', 409);
    }
    level.cost = cost;
  }),
  'POST /api/admin/team/remove': admin(({ body }) => game.removeTeam(state, body.teamId)),
  'POST /api/admin/adjust': admin(({ body, now }) => game.addAdjustment(state, body, now)),
  'POST /api/admin/sudden-death': admin(({ body }) =>
    body.clear ? game.clearSuddenDeath(state, body.scope) : game.markSuddenDeath(state, body.scope, body.teamId)
  ),
  'POST /api/admin/finalists': admin(({ body }) => game.lockFinalists(state, body.teamIds)),
  'POST /api/admin/r3/show': admin(({ body, now }) => game.showR3Question(state, questions.bank, body.questionId, now)),
  'POST /api/admin/r3/open': admin(({ now }) => game.openBuzzers(state, now)),
  'POST /api/admin/r3/call': admin(({ now }) => game.callNextTeam(state, now)),
  'POST /api/admin/r3/judge': admin(({ body, now }) => game.judgeR3(state, body.result, now)),
  'POST /api/admin/r3/close': admin(() => game.closeR3Question(state)),
  'POST /api/admin/r3/void': admin(({ body, now }) => game.voidR3Question(state, body.reason, now)),
  'POST /api/admin/r3/adjust': admin(({ body, now }) => game.adjustR3(state, body, now)),
  'POST /api/admin/reset': admin(({ body }) => {
    if (body.confirm !== 'RESET') throw new game.GameError('Type RESET to confirm.');
    const fresh = game.createState(state.config);
    fresh.adminSessions = state.adminSessions;
    // Reset in place: a sign-in still hashing holds a reference to this object, and must see the new
    // (empty) event rather than writing into a discarded one.
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, fresh);
  })
};

// ---------- http plumbing ----------

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024) {
        reject(new game.GameError('Request too large.', 413));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new game.GameError('Invalid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

// Gzip anything worth compressing: the polled state shrinks to roughly a tenth on venue Wi-Fi.
function sendBody(req, res, status, body, headers) {
  if (body.length > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
    body = zlib.gzipSync(body);
    headers = { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' };
  }
  res.writeHead(status, headers);
  res.end(body);
}

function send(req, res, status, payload, headers = {}) {
  const body = Buffer.from(JSON.stringify(payload));
  sendBody(req, res, status, body, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
}

// Slows passcode guessing: 10 wrong tries per device per team (or for the admin login) locks it for 5 minutes.
// Keyed by IP *and* team so one bad guesser on a shared campus network cannot lock out everyone.
const FAIL_LIMIT = 10;
const FAIL_WINDOW_MS = 5 * 60 * 1000;
const failures = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of failures) if (entry.resetAt <= now) failures.delete(key);
}, 60_000).unref();

function failureEntry(key, now) {
  const entry = failures.get(key);
  if (entry && entry.resetAt > now) return entry;
  failures.delete(key);
  return null;
}

async function handleApi(req, res, pathname) {
  const key = `${req.method} ${pathname}`;
  const route = Object.hasOwn(routes, key) ? routes[key] : null;
  if (!route) return send(req, res, 404, { error: 'Not found.' });
  // While stopping, refuse new changes instead of answering "OK" for something that won't be saved.
  if (shuttingDown && req.method === 'POST') {
    return send(req, res, 503, { error: 'The server is restarting. Try again in a moment.' }, { 'Retry-After': '2' });
  }
  try {
    const now = Date.now();
    if (game.tick(state, now)) saveState();
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    const session = game.getSession(state, token);
    if (route.auth === 'team' && !session) {
      return send(req, res, 401, { error: 'You have been signed out. Sign in again with your team passcode.' });
    }
    // Own keys only: otherwise "Bearer constructor" or "Bearer toString" would pass as an admin token.
    if (route.auth === 'admin' && !(token && Object.hasOwn(state.adminSessions, token))) {
      return send(req, res, 401, { error: 'Admin sign-in required.' });
    }
    const body = req.method === 'POST' ? await readBody(req) : {};
    const limitKey = route.limitKey && `${req.socket.remoteAddress}|${route.limitKey(body)}`;
    if (limitKey && failureEntry(limitKey, now)?.count >= FAIL_LIMIT) {
      return send(req, res, 429, { error: 'Too many wrong attempts. Wait 5 minutes or ask an organiser.' });
    }
    let result;
    try {
      result = (await route.fn({ body, session, token, now })) ?? { ok: true };
    } catch (err) {
      if (limitKey && err.status === 401) {
        const entry = failureEntry(limitKey, now) ?? { count: 0, resetAt: now + FAIL_WINDOW_MS };
        entry.count += 1;
        failures.set(limitKey, entry);
      }
      throw err;
    }
    // Every successful POST changes the game. Saves are batched (50 ms) and written one at a time;
    // the reply waits for the write, so "OK" always means the change survives a crash.
    if (req.method === 'POST') await saveState();
    if (result.csv !== undefined) {
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="dtd-standings.csv"'
      });
      return res.end(result.csv);
    }
    if (result.download !== undefined) {
      return send(req, res, 200, result.download, { 'Content-Disposition': 'attachment; filename="dtd-backup.json"' });
    }
    return send(req, res, 200, result);
  } catch (err) {
    if (err instanceof game.GameError) return send(req, res, err.status, { error: err.message }, err.headers);
    console.error(err);
    return send(req, res, 500, { error: 'Server error. Tell the technical operator.' });
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2'
};

function serveStatic(req, res, pathname) {
  if (!fs.existsSync(DIST_DIR)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Site not built. Run "npm run build", or use "npm run dev" during development.');
  }
  const safe = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(DIST_DIR, safe);
  if (!file.startsWith(DIST_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST_DIR, 'index.html');
  }
  // Built files under /assets have content hashes in their names, so browsers may keep them forever.
  const immutable = file.startsWith(path.join(DIST_DIR, 'assets'));
  sendBody(req, res, 200, readStatic(file), {
    'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache'
  });
}

// The built site is small and never changes while the server runs, so keep it in memory.
const staticCache = new Map();
function readStatic(file) {
  if (!staticCache.has(file)) staticCache.set(file, fs.readFileSync(file));
  return staticCache.get(file);
}

const server = http.createServer((req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname.startsWith('/api/')) return handleApi(req, res, pathname);
    return serveStatic(req, res, pathname);
  } catch (err) {
    console.error(err);
    res.writeHead(400);
    res.end('Bad request');
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(); // stop accepting new connections; in-flight requests finish
    void flushStateBeforeExit().finally(() => process.exit(0));
  });
}

server.listen(PORT, () => {
  console.log(`DTD Battleground server on http://localhost:${PORT} (state: ${STATE_FILE})`);
});
