import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from './game.js';

const bank = {
  practice: [{ id: 'p1', type: 'numeric', prompt: 'warm-up', answer: 7 }],
  round1: [
    { id: 'a', type: 'numeric', prompt: '1+1', answer: 2 },
    { id: 'b', type: 'mcq', prompt: 'pick', options: ['x', 'y'], answer: 1 },
    { id: 'c', type: 'numeric', prompt: '0.8', answer: 0.8, tolerance: 0.001 }
  ],
  round2: [
    ...Array.from({ length: 12 }, (_, i) => ({ id: `e${i}`, level: 'easy', domain: 'd', type: 'numeric', prompt: 'p', answer: 1 })),
    ...Array.from({ length: 9 }, (_, i) => ({ id: `m${i}`, level: 'medium', domain: 'd', type: 'numeric', prompt: 'p', answer: 1 })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: `h${i}`, level: 'hard', domain: 'd', type: 'numeric', prompt: 'p', answer: 1 }))
  ],
  round3: [
    { id: 'f1', type: 'numeric', prompt: 'q', answer: 1 },
    { id: 'f2', type: 'numeric', prompt: 'q', answer: 2 },
    { id: 'fp', practice: true, type: 'numeric', prompt: 'practice', answer: 3 }
  ]
};

const T0 = 1_000_000;

function setup(teamCount = 2) {
  const state = game.createState();
  const teams = [];
  for (let i = 0; i < teamCount; i++) {
    const { team } = game.registerTeam(state, { teamName: `Team ${i}`, passcode: 'pass1234', member: `Lead ${i}` }, T0);
    teams.push(team);
  }
  return { state, teams };
}

test('registration, team size cap and one session per member', () => {
  const { state, teams } = setup(1);
  assert.throws(() => game.registerTeam(state, { teamName: 'team 0', passcode: 'abcd', member: 'X' }, T0), /taken/);
  assert.throws(() => game.loginTeam(state, { teamName: 'Team 0', passcode: 'wrong', member: 'A' }, T0), /incorrect/);

  const first = game.loginTeam(state, { teamName: 'team 0', passcode: 'pass1234', member: 'Asha' }, T0);
  game.loginTeam(state, { teamName: 'Team 0', passcode: 'pass1234', member: 'Ben' }, T0);
  assert.equal(teams[0].members.length, 3);
  assert.throws(() => game.loginTeam(state, { teamName: 'Team 0', passcode: 'pass1234', member: 'Cara' }, T0), /already has 3/);

  // Same member signing in on a second device replaces the first session.
  const second = game.loginTeam(state, { teamName: 'Team 0', passcode: 'pass1234', member: 'asha' }, T0);
  assert.equal(second.replaced, true);
  assert.equal(game.getSession(state, first.token), null);
  assert.equal(game.getSession(state, second.token).member, 'Asha');

  game.setPhase(state, 'round1', T0);
  assert.throws(() => game.registerTeam(state, { teamName: 'Late', passcode: 'abcd', member: 'L' }, T0), /closed/);
  state.lateRegistration = true;
  game.registerTeam(state, { teamName: 'Late', passcode: 'abcd', member: 'L' }, T0);
});

test('round 1: one active question, one submission, timer survives and expires', () => {
  const { state, teams } = setup(1);
  const [t] = teams;
  assert.throws(() => game.openR1(state, bank, t, 'a', T0), /not live/);
  game.setPhase(state, 'round1', T0);

  game.openR1(state, bank, t, 'a', T0);
  game.openR1(state, bank, t, 'a', T0 + 1000); // re-opening (refresh / teammate) does not reset the timer
  assert.equal(state.r1[t.id].a.openedAt, T0);
  assert.throws(() => game.openR1(state, bank, t, 'b', T0 + 2000), /Q1 is still open/);

  assert.throws(() => game.submitR1(state, bank, t, 'Lead', 'a', 'two', T0 + 3000), /Enter a number/);
  assert.equal(game.submitR1(state, bank, t, 'Lead', 'a', ' 2 ', T0 + 5000).correct, true);
  assert.throws(() => game.submitR1(state, bank, t, 'Lead', 'a', '2', T0 + 6000), /already answered/);
  assert.throws(() => game.openR1(state, bank, t, 'a', T0 + 7000), /already used/);

  game.openR1(state, bank, t, 'b', T0 + 10_000);
  assert.throws(() => game.submitR1(state, bank, t, 'Lead', 'b', '5', T0 + 11_000), /Pick one/);
  // 60 s + grace has passed: late answer rejected, next question can be opened.
  assert.throws(() => game.submitR1(state, bank, t, 'Lead', 'b', '1', T0 + 10_000 + 63_000), /Time is up/);
  assert.equal(game.r1Status(state, state.r1[t.id].b, T0 + 71_000), 'expired');
  game.openR1(state, bank, t, 'c', T0 + 71_000);
  assert.equal(game.submitR1(state, bank, t, 'Lead', 'c', '0.8004', T0 + 72_000).correct, true);

  const row = game.computeStandings(state).round1[0];
  assert.equal(row.r1.points, 100);
  assert.equal(row.r1.timeMs, 5000 + 1000);
});

test('round 1 closes on its own and question deadlines never pass the round end', () => {
  const { state, teams } = setup(1);
  game.setPhase(state, 'round1', T0);
  const end = state.timers.round1.endsAt;
  game.openR1(state, bank, teams[0], 'a', end - 10_000);
  assert.equal(game.r1Deadline(state, state.r1[teams[0].id].a), end);
  assert.throws(() => game.openR1(state, bank, teams[0], 'b', end), /not live/);
  assert.equal(game.tick(state, end + game.GRACE_MS), true);
  assert.equal(state.phase, 'round1_closed');
});

test('round 2: budget, per-level caps, returns, no refunds, auto phase change', () => {
  const { state, teams } = setup(1);
  const [t] = teams;
  game.setPhase(state, 'round2_buy', T0);
  for (let i = 0; i < 10; i++) game.buyR2(state, bank, t, 'L', `e${i}`, T0);
  assert.throws(() => game.buyR2(state, bank, t, 'L', 'e10', T0), /at most 10 easy/);
  for (let i = 0; i < 4; i++) game.buyR2(state, bank, t, 'L', `m${i}`, T0);
  assert.equal(game.r2Spent(state, t.id), 200);
  assert.throws(() => game.buyR2(state, bank, t, 'L', 'h0', T0), /Not enough coins/);
  assert.throws(() => game.buyR2(state, bank, t, 'L', 'e0', T0), /already owns/);

  game.returnR2(state, t, 'm3', T0);
  assert.equal(game.r2Spent(state, t.id), 175);
  assert.throws(() => game.submitR2(state, bank, t, 'L', 'e0', '1', T0), /Solving is not open/);

  const buyEnd = state.timers.round2_buy.endsAt;
  assert.throws(() => game.buyR2(state, bank, t, 'L', 'm3', buyEnd), /market is closed/);
  game.tick(state, buyEnd + game.GRACE_MS);
  assert.equal(state.phase, 'round2_solve');
  assert.equal(state.timers.round2_solve.startsAt, buyEnd);

  assert.equal(game.submitR2(state, bank, t, 'L', 'e0', '1', buyEnd + 5000).correct, true);
  assert.equal(game.submitR2(state, bank, t, 'L', 'm0', '9', buyEnd + 6000).correct, false);
  assert.throws(() => game.submitR2(state, bank, t, 'L', 'm0', '1', buyEnd + 7000), /already answered/);
  assert.throws(() => game.submitR2(state, bank, t, 'L', 'h0', '1', buyEnd + 7000), /did not buy/);

  const row = game.computeStandings(state).round2[0];
  assert.equal(row.r2.points, 30);
  assert.equal(row.r2.coinsSpent, 175); // wrong answers are not refunded
});

test('every Round 2 budget strategy in the plan is affordable and hits its maximum', () => {
  const { levels, startCoins } = game.DEFAULT_CONFIG.r2;
  const strategies = [
    [{ easy: 10, medium: 4 }, 580],
    [{ hard: 2, medium: 2, easy: 7 }, 570],
    [{ medium: 8 }, 560],
    [{ hard: 5 }, 550]
  ];
  for (const [mix, max] of strategies) {
    const cost = Object.entries(mix).reduce((s, [l, n]) => s + levels[l].cost * n, 0);
    const points = Object.entries(mix).reduce((s, [l, n]) => s + levels[l].points * n, 0);
    assert.ok(cost <= startCoins, JSON.stringify(mix));
    assert.equal(points, max);
  }
});

test('qualification tie-breaks: earlier last correct, then fewer coins, then sudden death', () => {
  const { state, teams } = setup(3);
  const [a, b, c] = teams;
  game.setPhase(state, 'round2_buy', T0);
  game.buyR2(state, bank, a, 'L', 'e0', T0);
  game.buyR2(state, bank, b, 'L', 'e0', T0);
  game.buyR2(state, bank, b, 'L', 'e1', T0);
  game.buyR2(state, bank, c, 'L', 'e0', T0);
  game.setPhase(state, 'round2_solve', T0 + 1);
  game.submitR2(state, bank, a, 'L', 'e0', '1', T0 + 9000);
  game.submitR2(state, bank, b, 'L', 'e0', '1', T0 + 5000);
  game.submitR2(state, bank, b, 'L', 'e1', '0', T0 + 6000);
  game.submitR2(state, bank, c, 'L', 'e0', '1', T0 + 9000);

  let q = game.computeStandings(state).qualification;
  assert.deepEqual(q.map((r) => r.name), ['Team 1', 'Team 0', 'Team 2']);
  assert.equal(q[0].tied, false);
  assert.equal(q[1].tied, true); // Team 0 and Team 2: same points, time and coins

  game.markSuddenDeath(state, 'qualification', c.id);
  q = game.computeStandings(state).qualification;
  assert.deepEqual(q.map((r) => r.name), ['Team 1', 'Team 2', 'Team 0']);

  game.addAdjustment(state, { round: 'r2', teamId: a.id, delta: 5, reason: 'Answer key fix' }, T0);
  assert.equal(game.computeStandings(state).qualification[0].name, 'Team 0');
  assert.throws(() => game.addAdjustment(state, { round: 'r2', teamId: a.id, delta: 5, reason: ' ' }, T0), /reason/);
});

test('round 3: buzz order, rebound, timeout, void reversal and final ties', () => {
  const { state, teams } = setup(3);
  const [a, b, c] = teams;
  game.lockFinalists(state, [c.id, a.id, b.id]);
  game.setPhase(state, 'round3', T0);
  assert.deepEqual(state.r3.finalists, [a.id, b.id, c.id]); // stored in qualifying order

  game.showR3Question(state, bank, 'f1', T0);
  assert.throws(() => game.buzz(state, a, T0), /not open/);
  game.openBuzzers(state, T0 + 100);
  game.buzz(state, b, T0 + 300);
  game.buzz(state, a, T0 + 200);
  assert.equal(game.buzz(state, b, T0 + 400).position, 1); // duplicate buzz keeps its place

  assert.equal(game.callNextTeam(state, T0 + 500), b.id);
  game.judgeR3(state, 'wrong', T0 + 600);
  assert.throws(() => game.buzz(state, b, T0 + 700), /out for this question/);
  assert.equal(game.callNextTeam(state, T0 + 800), a.id); // the one rebound
  game.judgeR3(state, 'timeout', T0 + 900);
  assert.equal(state.r3.current.status, 'done');

  game.showR3Question(state, bank, 'f2', T0 + 1000);
  game.openBuzzers(state, T0 + 1100);
  game.buzz(state, c, T0 + 1200);
  game.callNextTeam(state, T0 + 1300);
  game.judgeR3(state, 'correct', T0 + 1400);
  game.voidR3Question(state, 'buzzer lag', T0 + 1500);
  assert.equal(game.questionNumber(state), 2); // voided question does not count

  const final = game.computeStandings(state).final;
  assert.deepEqual(final.map((r) => [r.name, r.score]), [['Team 2', 0], ['Team 0', -20], ['Team 1', -20]]);
  // Team 0 and Team 1 are level on -20: the higher qualifier (Team 0) is ahead until sudden death says otherwise.
  assert.equal(final[0].tied, false);
  assert.equal(final[1].tied, true);
  game.markSuddenDeath(state, 'final', b.id);
  assert.equal(game.computeStandings(state).final[1].name, 'Team 1');
});

test('practice round uses Round 1 rules but never scores', () => {
  const { state, teams } = setup(1);
  const [t] = teams;
  assert.throws(() => game.openR1(state, bank, t, 'p1', T0, 'practice'), /Practice is not live/);
  game.setPhase(state, 'practice', T0);
  game.registerTeam(state, { teamName: 'Latecomer', passcode: 'abcd', member: 'L' }, T0); // still registering
  assert.throws(() => game.openR1(state, bank, t, 'a', T0, 'round1'), /Round 1 is not live/);
  game.openR1(state, bank, t, 'p1', T0, 'practice');
  assert.equal(game.submitR1(state, bank, t, 'L', 'p1', '7', T0 + 1000, 'practice').correct, true);
  assert.throws(() => game.submitR1(state, bank, t, 'L', 'p1', '7', T0 + 2000, 'practice'), /already answered/);
  assert.equal(game.computeStandings(state).round1.find((r) => r.teamId === t.id).r1.points, 0);
  assert.deepEqual(state.r1, {});
});

test('buzzer practice runs the full flow without touching scores or numbering', () => {
  const { state, teams } = setup(2);
  const [a, b] = teams;
  game.lockFinalists(state, [a.id, b.id]);
  game.setPhase(state, 'round3', T0);
  game.showR3Question(state, bank, 'fp', T0);
  game.openBuzzers(state, T0 + 10);
  game.buzz(state, a, T0 + 20);
  game.buzz(state, b, T0 + 30);
  game.callNextTeam(state, T0 + 40);
  game.judgeR3(state, 'wrong', T0 + 50);
  game.callNextTeam(state, T0 + 60);
  game.judgeR3(state, 'correct', T0 + 70);
  assert.equal(state.r3.log.length, 0);
  game.lockFinalists(state, [a.id, b.id]); // still allowed: the real final has not started
  game.showR3Question(state, bank, 'f1', T0 + 100);
  assert.equal(game.questionNumber(state), 1);
});
