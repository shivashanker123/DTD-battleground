// DTD Battleground game rules. Every function here is pure over (state, questions, now)
// so the server owns timers, answer checking and totals, and the rules can be unit-tested.
import crypto from 'node:crypto';

export const PHASES = [
  'registration',
  'practice',
  'round1',
  'round1_closed',
  'round2_buy',
  'round2_solve',
  'round2_closed',
  'round3',
  'finished'
];

// Network slack for submissions that arrive just after a timer hits zero.
export const GRACE_MS = 2000;

export const DEFAULT_CONFIG = {
  maxTeamSize: 3,
  r1: { durationSec: 30 * 60, questionSec: 60, points: 50 },
  r2: {
    buySec: 4 * 60,
    solveSec: 25 * 60,
    startCoins: 200,
    levels: {
      easy: { cost: 10, points: 30, max: 10 },
      medium: { cost: 25, points: 70, max: 8 },
      hard: { cost: 40, points: 110, max: 5 }
    }
  },
  r3: { finalists: 8, correct: 50, wrong: -20, answerSec: 10, maxAttempts: 2 }
};

export class GameError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const fail = (message, status) => {
  throw new GameError(message, status);
};

export function createState(config = DEFAULT_CONFIG) {
  return {
    version: 1,
    config: structuredClone(config),
    phase: 'registration',
    timers: {},
    lateRegistration: false,
    teams: {},
    sessions: {},
    adminSessions: {},
    practice: {},
    r1: {},
    r2: {},
    adjustments: [],
    suddenDeath: { qualification: {}, final: {} },
    r3: { finalists: [], current: null, history: [], log: [] }
  };
}

// ---------- phases & timers ----------

export function setPhase(state, phase, now) {
  if (!PHASES.includes(phase)) fail(`Unknown phase "${phase}".`);
  const { r1, r2 } = state.config;
  state.phase = phase;
  if (phase === 'round1') {
    state.timers.round1 = { startsAt: now, endsAt: now + r1.durationSec * 1000 };
  } else if (phase === 'round2_buy') {
    state.timers.round2_buy = { startsAt: now, endsAt: now + r2.buySec * 1000 };
    delete state.timers.round2_solve;
  } else if (phase === 'round2_solve') {
    state.timers.round2_solve = { startsAt: now, endsAt: now + r2.solveSec * 1000 };
  }
}

export function extendPhase(state, seconds) {
  const timer = state.timers[state.phase];
  if (!timer) fail('The current phase has no timer to extend.');
  const delta = Math.round(Number(seconds) * 1000);
  if (!Number.isFinite(delta) || delta === 0) fail('Enter a number of seconds.');
  timer.endsAt += delta;
}

// Advances timed phases whose clock has run out. Returns true when anything changed.
export function tick(state, now) {
  const timer = state.timers[state.phase];
  if (!timer || now < timer.endsAt + GRACE_MS) return false;
  if (state.phase === 'round1') {
    state.phase = 'round1_closed';
  } else if (state.phase === 'round2_buy') {
    // Solving starts the moment buying ends, not when the grace window closes.
    state.phase = 'round2_solve';
    state.timers.round2_solve = {
      startsAt: timer.endsAt,
      endsAt: timer.endsAt + state.config.r2.solveSec * 1000
    };
    tick(state, now);
  } else if (state.phase === 'round2_solve') {
    state.phase = 'round2_closed';
  } else {
    return false;
  }
  return true;
}

// ---------- teams & sessions ----------

export const cleanName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();

const hashPasscode = (passcode, salt) => crypto.scryptSync(passcode, salt, 32).toString('hex');

// HTTP requests use this version so a password hash does not block timers, polls or other teams.
// The synchronous version above stays for the pure game-engine API and its fast unit tests.
const hashPasscodeAsync = (passcode, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(passcode, salt, 32, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString('hex'));
    });
  });

function checkPasscode(team, passcode) {
  const given = Buffer.from(hashPasscode(passcode, team.salt), 'hex');
  const stored = Buffer.from(team.hash, 'hex');
  return given.length === stored.length && crypto.timingSafeEqual(given, stored);
}

async function checkPasscodeAsync(team, passcode) {
  const given = Buffer.from(await hashPasscodeAsync(passcode, team.salt), 'hex');
  const stored = Buffer.from(team.hash, 'hex');
  return given.length === stored.length && crypto.timingSafeEqual(given, stored);
}

function validateCredentials({ teamName, passcode, member }) {
  const name = cleanName(teamName);
  const person = cleanName(member);
  const code = String(passcode ?? '');
  if (name.length < 2 || name.length > 40) fail('Team name must be 2–40 characters.');
  if (person.length < 1 || person.length > 40) fail('Enter your name (up to 40 characters).');
  if (code.length < 4 || code.length > 64) fail('Team passcode must be 4–64 characters.');
  return { name, person, code };
}

// One live session per member: signing in again elsewhere signs the old device out.
function startSession(state, team, member, now) {
  let replaced = false;
  for (const [token, session] of Object.entries(state.sessions)) {
    if (session.teamId === team.id && sameName(session.member, member)) {
      delete state.sessions[token];
      replaced = true;
    }
  }
  const token = crypto.randomBytes(24).toString('hex');
  state.sessions[token] = { teamId: team.id, member, createdAt: now };
  return { token, replaced };
}

export function registerTeam(state, input, now) {
  const { name, person, code } = validateCredentials(input);
  if (!['registration', 'practice'].includes(state.phase) && !state.lateRegistration) {
    fail('Team registration is closed. Ask an organiser at the help desk.', 403);
  }
  if (Object.values(state.teams).some((t) => sameName(t.name, name))) {
    fail('That team name is taken. Choose another, or join the team with its passcode.', 409);
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const team = {
    id: `t_${crypto.randomBytes(6).toString('hex')}`,
    name,
    salt,
    hash: hashPasscode(code, salt),
    members: [person],
    createdAt: now
  };
  state.teams[team.id] = team;
  return { team, ...startSession(state, team, person, now) };
}

// Async HTTP path: crypto.scrypt runs in Node's worker pool instead of freezing the event loop.
// Repeat the checks after awaiting: another request may have changed state while hashing.
export async function registerTeamAsync(state, input, now) {
  const { name, person, code } = validateCredentials(input);
  const registrationOpen = () => ['registration', 'practice'].includes(state.phase) || state.lateRegistration;
  const nameTaken = () => Object.values(state.teams).some((t) => sameName(t.name, name));
  if (!registrationOpen()) fail('Team registration is closed. Ask an organiser at the help desk.', 403);
  if (nameTaken()) fail('That team name is taken. Choose another, or join the team with its passcode.', 409);

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await hashPasscodeAsync(code, salt);

  if (!registrationOpen()) fail('Team registration is closed. Ask an organiser at the help desk.', 403);
  if (nameTaken()) fail('That team name is taken. Choose another, or join the team with its passcode.', 409);
  const team = {
    id: `t_${crypto.randomBytes(6).toString('hex')}`,
    name,
    salt,
    hash,
    members: [person],
    createdAt: now
  };
  state.teams[team.id] = team;
  return { team, ...startSession(state, team, person, now) };
}

export function loginTeam(state, input, now) {
  const { name, person, code } = validateCredentials(input);
  const team = Object.values(state.teams).find((t) => sameName(t.name, name));
  if (!team || !checkPasscode(team, code)) fail('Team name or passcode is incorrect.', 401);
  let member = team.members.find((m) => sameName(m, person));
  if (!member) {
    if (team.members.length >= state.config.maxTeamSize) {
      fail(
        `${team.name} already has ${state.config.maxTeamSize} members (${team.members.join(', ')}). Sign in with one of those names.`,
        409
      );
    }
    member = person;
    team.members.push(member);
  }
  return { team, member, ...startSession(state, team, member, now) };
}

export async function loginTeamAsync(state, input, now) {
  const { name, person, code } = validateCredentials(input);
  let team = Object.values(state.teams).find((t) => sameName(t.name, name));
  if (!team || !(await checkPasscodeAsync(team, code))) fail('Team name or passcode is incorrect.', 401);

  // An organiser may have removed the team while its passcode was being checked.
  team = state.teams[team.id];
  if (!team) fail('Team name or passcode is incorrect.', 401);
  let member = team.members.find((m) => sameName(m, person));
  if (!member) {
    if (team.members.length >= state.config.maxTeamSize) {
      fail(
        `${team.name} already has ${state.config.maxTeamSize} members (${team.members.join(', ')}). Sign in with one of those names.`,
        409
      );
    }
    member = person;
    team.members.push(member);
  }
  return { team, member, ...startSession(state, team, member, now) };
}

export function getSession(state, token) {
  const session = token && state.sessions[token];
  if (!session) return null;
  const team = state.teams[session.teamId];
  return team ? { team, member: session.member } : null;
}

export function logout(state, token) {
  delete state.sessions[token];
}

export function removeTeam(state, teamId) {
  if (!state.teams[teamId]) fail('Team not found.', 404);
  delete state.teams[teamId];
  for (const [token, s] of Object.entries(state.sessions)) {
    if (s.teamId === teamId) delete state.sessions[token];
  }
  state.r3.finalists = state.r3.finalists.filter((id) => id !== teamId);
}

// ---------- answers ----------

const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

// Throws on malformed input *before* anything is recorded, so a typo never burns a team's only attempt.
export function grade(question, raw) {
  if (question.type === 'mcq') {
    const idx = Number(raw);
    if (raw === '' || raw === null || !Number.isInteger(idx) || idx < 0 || idx >= question.options.length) {
      fail('Pick one of the options.');
    }
    return { answer: idx, correct: idx === question.answer };
  }
  const text = String(raw ?? '').trim().replace(/,/g, '');
  if (!NUMBER_RE.test(text)) fail('Enter a number, e.g. 42 or 0.75.');
  const value = Number(text);
  const tolerance = question.tolerance ?? 1e-9;
  return { answer: value, correct: Math.abs(value - question.answer) <= tolerance };
}

// ---------- Round 1: Puzzle Sprint ----------

// The practice round runs the Puzzle Sprint rules on its own questions and never counts towards scores.
function sprint(state, questions, kind) {
  if (kind === 'practice') {
    return { list: questions.practice ?? [], store: (state.practice ??= {}), phase: 'practice', name: 'Practice', endsAt: Infinity };
  }
  return { list: questions.round1, store: state.r1, phase: 'round1', name: 'Round 1', endsAt: state.timers.round1?.endsAt ?? Infinity };
}

export function r1Deadline(state, rec, kind = 'round1') {
  const own = rec.openedAt + state.config.r1.questionSec * 1000;
  const roundEnd = kind === 'practice' ? Infinity : (state.timers.round1?.endsAt ?? Infinity);
  return Math.min(own, roundEnd);
}

export function r1Status(state, rec, now, kind = 'round1') {
  if (!rec) return 'locked';
  if (rec.submittedAt) return rec.correct ? 'correct' : 'wrong';
  return now <= r1Deadline(state, rec, kind) ? 'active' : 'expired';
}

export function openR1(state, questions, team, qid, now, kind = 'round1') {
  const s = sprint(state, questions, kind);
  if (state.phase !== s.phase || now >= s.endsAt) fail(`${s.name} is not live.`, 403);
  const index = s.list.findIndex((q) => q.id === qid);
  if (index === -1) fail('Question not found.', 404);
  const recs = (s.store[team.id] ??= {});
  const existing = recs[qid];
  if (existing) {
    if (r1Status(state, existing, now, kind) === 'active') return existing; // teammate opened it already
    fail('Your team has already used this question.', 409);
  }
  const activeId = Object.keys(recs).find((id) => r1Status(state, recs[id], now, kind) === 'active');
  if (activeId) {
    const n = s.list.findIndex((q) => q.id === activeId) + 1;
    fail(`Q${n} is still open. Answer it or let its timer run out first.`, 409);
  }
  recs[qid] = { openedAt: now };
  return recs[qid];
}

export function submitR1(state, questions, team, member, qid, raw, now, kind = 'round1') {
  const s = sprint(state, questions, kind);
  if (state.phase !== s.phase) fail(`${s.name} is closed.`, 403);
  const question = s.list.find((q) => q.id === qid);
  if (!question) fail('Question not found.', 404);
  const rec = s.store[team.id]?.[qid];
  if (!rec) fail('Open the question first.', 409);
  if (rec.submittedAt) fail('Your team has already answered this question.', 409);
  if (now > r1Deadline(state, rec, kind) + GRACE_MS) fail('Time is up for this question.', 410);
  const { answer, correct } = grade(question, raw);
  Object.assign(rec, { submittedAt: now, answer, correct, by: member });
  return { correct };
}

// ---------- Round 2: Risk Market ----------

const r2Entry = (state, teamId) => (state.r2[teamId] ??= { purchases: {} });

export function r2Spent(state, teamId) {
  return Object.values(state.r2[teamId]?.purchases ?? {}).reduce((sum, p) => sum + p.cost, 0);
}

export function r2LevelCount(state, teamId, level) {
  return Object.values(state.r2[teamId]?.purchases ?? {}).filter((p) => p.level === level).length;
}

export function buyR2(state, questions, team, member, qid, now) {
  if (state.phase !== 'round2_buy' || now >= state.timers.round2_buy.endsAt) fail('The market is closed.', 403);
  const question = questions.round2.find((q) => q.id === qid);
  if (!question) fail('Question not found.', 404);
  const entry = r2Entry(state, team.id);
  if (entry.purchases[qid]) fail('Your team already owns this question.', 409);
  const level = state.config.r2.levels[question.level];
  if (r2LevelCount(state, team.id, question.level) >= level.max) {
    fail(`You can hold at most ${level.max} ${question.level} questions.`, 409);
  }
  const coinsLeft = state.config.r2.startCoins - r2Spent(state, team.id);
  if (level.cost > coinsLeft) fail(`Not enough coins: this costs ${level.cost}, you have ${coinsLeft}.`, 409);
  entry.purchases[qid] = { level: question.level, cost: level.cost, points: level.points, boughtAt: now, by: member };
  return entry.purchases[qid];
}

// Undo a purchase while the market is still open (before anything has been seen).
export function returnR2(state, team, qid, now) {
  if (state.phase !== 'round2_buy' || now >= state.timers.round2_buy.endsAt) fail('The market is closed.', 403);
  const entry = state.r2[team.id];
  if (!entry?.purchases[qid]) fail('Your team does not own this question.', 404);
  delete entry.purchases[qid];
}

export function submitR2(state, questions, team, member, qid, raw, now) {
  if (state.phase !== 'round2_solve') fail('Solving is not open.', 403);
  const question = questions.round2.find((q) => q.id === qid);
  if (!question) fail('Question not found.', 404);
  const purchase = state.r2[team.id]?.purchases[qid];
  if (!purchase) fail('Your team did not buy this question.', 403);
  if (purchase.submittedAt) fail('Your team has already answered this question.', 409);
  const { answer, correct } = grade(question, raw);
  Object.assign(purchase, { submittedAt: now, answer, correct, by: member });
  return { correct };
}

// ---------- adjustments & tie-breaks ----------

export function addAdjustment(state, { round, teamId, delta, reason }, now) {
  if (!['r1', 'r2'].includes(round)) fail('Round must be r1 or r2. Use the final console for Round 3.');
  if (!state.teams[teamId]) fail('Team not found.', 404);
  const points = Number(delta);
  if (!Number.isFinite(points) || points === 0) fail('Enter a non-zero point change.');
  const why = cleanName(reason);
  if (!why) fail('A reason is required for every score correction.');
  const entry = { id: crypto.randomBytes(4).toString('hex'), round, teamId, delta: points, reason: why, at: now };
  state.adjustments.push(entry);
  return entry;
}

// Records the outcome of a sudden-death question: each marked team ranks ahead of tied teams marked later.
export function markSuddenDeath(state, scope, teamId) {
  const table = state.suddenDeath[scope];
  if (!table) fail('Unknown tie-break scope.');
  if (!state.teams[teamId]) fail('Team not found.', 404);
  if (teamId in table) return;
  table[teamId] = Object.keys(table).length;
}

export function clearSuddenDeath(state, scope) {
  if (!state.suddenDeath[scope]) fail('Unknown tie-break scope.');
  state.suddenDeath[scope] = {};
}

// ---------- standings ----------

const byKeys = (keys) => (a, b) => {
  for (const key of keys) {
    const d = key(a) - key(b);
    if (d !== 0 && !Number.isNaN(d)) return d; // Infinity - Infinity is NaN: treat as equal

  }
  return 0;
};

// Sorts rows and flags groups that are still level after every automatic tie-break.
function rankRows(rows, autoKeys, sdKey, nameKey = (r) => r.name) {
  const autoCmp = byKeys(autoKeys);
  rows.sort((a, b) => autoCmp(a, b) || byKeys([sdKey])(a, b) || nameKey(a).localeCompare(nameKey(b)));
  rows.forEach((row, i) => {
    row.rank = i + 1;
    const levelWith = (other) => other && autoCmp(row, other) === 0;
    row.tied = levelWith(rows[i - 1]) || levelWith(rows[i + 1]);
  });
  return rows;
}

export function computeStandings(state) {
  const rows = Object.values(state.teams).map((team) => {
    const adj = (round) =>
      state.adjustments.filter((a) => a.teamId === team.id && a.round === round).reduce((s, a) => s + a.delta, 0);

    const r1Recs = Object.values(state.r1[team.id] ?? {});
    const r1Correct = r1Recs.filter((r) => r.correct);
    const r1 = {
      correct: r1Correct.length,
      attempted: r1Recs.length,
      timeMs: r1Correct.reduce((s, r) => s + (r.submittedAt - r.openedAt), 0),
      adjustment: adj('r1')
    };
    r1.points = r1.correct * state.config.r1.points + r1.adjustment;

    const purchases = Object.values(state.r2[team.id]?.purchases ?? {});
    const r2Correct = purchases.filter((p) => p.correct);
    const r2 = {
      bought: purchases.length,
      correct: r2Correct.length,
      coinsSpent: purchases.reduce((s, p) => s + p.cost, 0),
      lastCorrectAt: r2Correct.length ? Math.max(...r2Correct.map((p) => p.submittedAt)) : null,
      adjustment: adj('r2')
    };
    r2.points = r2Correct.reduce((s, p) => s + p.points, 0) + r2.adjustment;

    return {
      teamId: team.id,
      name: team.name,
      members: team.members,
      r1,
      r2,
      total: r1.points + r2.points
    };
  });

  const sd = (scope) => (row) => state.suddenDeath[scope][row.teamId] ?? Infinity;
  const lastCorrect = (row) => row.r2.lastCorrectAt ?? Infinity;

  // Qualification: total, then Round 2 tie-breaks (earlier last correct answer, fewer coins spent),
  // then Round 1 tie-break (less total time on correct answers), then sudden death.
  const qualification = rankRows(
    rows.map((r) => ({ ...r })),
    [(r) => -r.total, lastCorrect, (r) => r.r2.coinsSpent, (r) => r.r1.timeMs],
    sd('qualification')
  );

  const round1 = rankRows(
    rows.map((r) => ({ ...r })),
    [(r) => -r.r1.points, (r) => r.r1.timeMs],
    () => 0
  );

  const round2 = rankRows(
    rows.map((r) => ({ ...r })),
    [(r) => -r.r2.points, lastCorrect, (r) => r.r2.coinsSpent],
    () => 0
  );

  const finalists = state.r3.finalists.filter((id) => state.teams[id]);
  const final = rankRows(
    finalists.map((teamId, i) => ({
      teamId,
      name: state.teams[teamId].name,
      qualifierRank: i + 1,
      score: state.r3.log.filter((l) => l.teamId === teamId).reduce((s, l) => s + l.delta, 0)
    })),
    [(r) => -r.score],
    // Final ties: sudden death between tied teams, then the higher qualifier wins.
    (r) => (sd('final')(r) === Infinity ? 1e6 + r.qualifierRank : sd('final')(r))
  );

  return { qualification, round1, round2, final };
}

// ---------- Round 3: Buzzer Final ----------

export function lockFinalists(state, teamIds) {
  const { qualification } = computeStandings(state);
  let ids = teamIds;
  if (!ids || ids.length === 0) {
    ids = qualification.slice(0, state.config.r3.finalists).map((r) => r.teamId);
  } else {
    for (const id of ids) if (!state.teams[id]) fail('Unknown team in finalist list.', 404);
    // Keep the list in qualifying order so "higher qualifier wins" stays meaningful.
    const order = new Map(qualification.map((r) => [r.teamId, r.rank]));
    ids = [...new Set(ids)].sort((a, b) => order.get(a) - order.get(b));
  }
  if (state.r3.log.length > 0) fail('The final has started; finalists can no longer change.', 409);
  state.r3.finalists = ids;
}

const currentOrFail = (state) => state.r3.current ?? fail('No question is on screen.', 409);

function finishCurrent(state) {
  const cur = state.r3.current;
  if (cur) state.r3.history.push(cur);
  state.r3.current = null;
}

export function showR3Question(state, questions, qid, now) {
  const question = questions.round3.find((q) => q.id === qid);
  if (!question) fail('Question not found.', 404);
  const cur = state.r3.current;
  if (cur && !['done', 'void'].includes(cur.status)) fail('Finish or void the current question first.', 409);
  if ([...state.r3.history, cur].some((h) => h?.questionId === qid)) fail('That question has already been used.', 409);
  finishCurrent(state);
  state.r3.current = {
    questionId: qid,
    practice: Boolean(question.practice), // buzzer practice: same flow, no points
    status: 'shown',
    shownAt: now,
    buzzes: [],
    attempts: [],
    answering: null
  };
}

export function openBuzzers(state, now) {
  const cur = currentOrFail(state);
  if (cur.status !== 'shown') fail('Buzzers can only be opened once, after the question is read.', 409);
  cur.status = 'open';
  cur.openedAt = now;
}

export function buzz(state, team, now) {
  if (state.phase !== 'round3') fail('The final is not running.', 403);
  if (!state.r3.finalists.includes(team.id)) fail('Only finalists can buzz.', 403);
  const cur = state.r3.current;
  if (!cur || !['open', 'answering'].includes(cur.status)) fail('Buzzers are not open.', 409);
  if (cur.attempts.includes(team.id)) fail('Your team is out for this question.', 409);
  const position = cur.buzzes.findIndex((b) => b.teamId === team.id);
  if (position !== -1) return { position: position + 1 };
  cur.buzzes.push({ teamId: team.id, at: now });
  return { position: cur.buzzes.length };
}

export function callNextTeam(state, now) {
  const cur = currentOrFail(state);
  if (cur.status !== 'open') fail('Buzzers must be open with no team answering.', 409);
  if (cur.attempts.length >= state.config.r3.maxAttempts) fail('The rebound has already been used.', 409);
  const next = cur.buzzes.find((b) => !cur.attempts.includes(b.teamId));
  if (!next) fail('No eligible team has buzzed yet.', 409);
  cur.status = 'answering';
  cur.answering = { teamId: next.teamId, startedAt: now, endsAt: now + state.config.r3.answerSec * 1000 };
  return next.teamId;
}

export function judgeR3(state, result, now) {
  const cur = currentOrFail(state);
  if (cur.status !== 'answering') fail('No team is answering.', 409);
  const { teamId } = cur.answering;
  const { correct, wrong, maxAttempts } = state.config.r3;
  const label = `Q${questionNumber(state)}`;
  const record = (delta, reason) => {
    if (!cur.practice) state.r3.log.push({ teamId, delta, reason, questionId: cur.questionId, at: now });
  };
  if (result === 'correct') {
    record(correct, `${label} correct`);
    cur.status = 'done';
    cur.winner = teamId;
  } else if (result === 'wrong' || result === 'timeout') {
    record(wrong, `${label} ${result}`);
    cur.attempts.push(teamId);
    cur.status = cur.attempts.length >= maxAttempts ? 'done' : 'open';
  } else {
    fail('Result must be correct, wrong or timeout.');
  }
  cur.answering = null;
}

export function closeR3Question(state) {
  const cur = currentOrFail(state);
  if (cur.status === 'answering') fail('Judge the answering team first.', 409);
  cur.status = 'done';
}

// Voiding reverses any points from that question with logged entries; nothing is silently overwritten.
export function voidR3Question(state, reason, now) {
  const cur = currentOrFail(state);
  const why = cleanName(reason) || 'buzzer fault';
  const label = `Q${questionNumber(state)}`;
  const byTeam = new Map();
  for (const l of state.r3.log.filter((l) => l.questionId === cur.questionId)) {
    byTeam.set(l.teamId, (byTeam.get(l.teamId) ?? 0) + l.delta);
  }
  for (const [teamId, sum] of byTeam) {
    if (sum !== 0) {
      state.r3.log.push({ teamId, delta: -sum, reason: `${label} voided (${why})`, questionId: cur.questionId, at: now });
    }
  }
  cur.status = 'void';
  cur.voidReason = why;
  cur.answering = null;
}

export function adjustR3(state, { teamId, delta, reason }, now) {
  if (!state.r3.finalists.includes(teamId)) fail('That team is not a finalist.', 404);
  const points = Number(delta);
  if (!Number.isFinite(points) || points === 0) fail('Enter a non-zero point change.');
  const why = cleanName(reason);
  if (!why) fail('A reason is required for every score correction.');
  state.r3.log.push({ teamId, delta: points, reason: `Correction: ${why}`, questionId: null, at: now });
}

// The on-screen number of the current question, ignoring voided and practice ones.
export function questionNumber(state) {
  const played = state.r3.history.filter((h) => h.status !== 'void' && !h.practice).length;
  return played + 1;
}
