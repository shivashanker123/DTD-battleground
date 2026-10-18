// DTD Battleground server: owns timers, access, answer checking and totals.
// State is persisted in short, serialized batches so a registration rush cannot freeze the event loop.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as game from './game.js';
import { loadQuestions } from './questions.js';

const here = path.dirname(fileURLToPath(import.meta.url));
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
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

const SAVE_DEBOUNCE_MS = 250;
let saveRequested = false;
let saveTimer = null;
let saveRunning = null;
let saveSequence = 0;

// Coalesce a burst of mutations into one latest-state snapshot. Only one writer may run at a
// time; otherwise an older write could complete after a newer one and overwrite it.
function saveState() {
  saveRequested = true;
  if (saveTimer || saveRunning) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void flushState();
  }, SAVE_DEBOUNCE_MS);
}

async function flushState() {
  if (saveRunning) return saveRunning;
  if (!saveRequested) return;

  saveRequested = false;
  const snapshot = JSON.stringify(state);
  const tmp = `${STATE_FILE}.${process.pid}.${++saveSequence}.tmp`;
  saveRunning = (async () => {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    await fs.promises.writeFile(tmp, snapshot);
    await fs.promises.rename(tmp, STATE_FILE); // atomic replace: never leaves a partial state file
  })();

  try {
    await saveRunning;
  } catch (err) {
    // Keep the state dirty so the next mutation retries persistence instead of silently losing it.
    saveRequested = true;
    console.error('Could not persist game state:', err);
  } finally {
    saveRunning = null;
    if (saveRequested) saveState();
  }
}

async function flushStateBeforeExit() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  while (saveRunning || saveRequested) {
    if (saveRunning) await saveRunning.catch(() => {});
    else await flushState();
  }
}

let state = loadState();
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

function publicState(session, now) {
  const { phase, config } = state;
  const standings = game.computeStandings(state);
  const strip = (rows) => rows.map(({ members: _members, ...row }) => row);
  const view = {
    serverNow: now,
    phase,
    timers: state.timers,
    registrationOpen: ['registration', 'practice'].includes(phase) || state.lateRegistration,
    config: { maxTeamSize: config.maxTeamSize, r1: config.r1, r2: config.r2, r3: config.r3 },
    counts: { round1: questions.bank.round1.length, teams: Object.keys(state.teams).length },
    standings: {
      qualification: strip(standings.qualification),
      round1: strip(standings.round1),
      round2: strip(standings.round2),
      final: standings.final
    },
    finalists: state.r3.finalists,
    round3: ['round3', 'finished'].includes(phase) ? publicR3(now) : null,
    me: null
  };
  if (session) {
    const { team, member } = session;
    view.me = { teamId: team.id, teamName: team.name, member, members: team.members };
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
    isSampleQuestions: questions.isSample
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
    const keepAdmins = state.adminSessions;
    const config = state.config;
    state = game.createState(config);
    state.adminSessions = keepAdmins;
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
  const route = routes[`${req.method} ${pathname}`];
  if (!route) return send(req, res, 404, { error: 'Not found.' });
  try {
    const now = Date.now();
    if (game.tick(state, now)) saveState();
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    const session = game.getSession(state, token);
    if (route.auth === 'team' && !session) {
      return send(req, res, 401, { error: 'You have been signed out. Sign in again with your team passcode.' });
    }
    if (route.auth === 'admin' && !state.adminSessions[token]) {
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
    // Every successful POST changes the game. Persistence is coalesced for 250 ms but flushed
    // serially, keeping state safe without blocking a registration burst.
    if (req.method === 'POST') saveState();
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
    if (err instanceof game.GameError) return send(req, res, err.status, { error: err.message });
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
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname);
  return serveStatic(req, res, pathname);
});

let shuttingDown = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    void flushStateBeforeExit().finally(() => process.exit(0));
  });
}

server.listen(PORT, () => {
  console.log(`DTD Battleground server on http://localhost:${PORT} (state: ${STATE_FILE})`);
});
