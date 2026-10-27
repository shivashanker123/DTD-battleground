import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download, LogOut, Monitor, ShieldAlert } from 'lucide-react';
import { api, adminToken, downloadAdminFile } from '../api';
import { usePolledState, useServerNow } from '../context/EventContext';
import { Card, ConnectionBanner, Countdown, ErrorNote, PHASE_LABELS, formatSeconds } from '../components/ui';
import { CONNECTION_LOST_TEXT } from '../connection';
import { FinalBoard, FinalQuestion } from '../components/FinalLive';

const BTN = 'px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed';
const PRIMARY = `${BTN} bg-slate-900 text-white hover:bg-slate-800`;
const SECONDARY = `${BTN} bg-slate-100 text-slate-800 hover:bg-slate-200`;
const DANGER = `${BTN} bg-rose-600 text-white hover:bg-rose-700`;
const INPUT = 'px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden';

const Login = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { token } = await api('/admin/login', { body: { password } });
      adminToken.set(token);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="p-8 w-full max-w-sm space-y-4 text-left">
        <h1 className="font-black text-slate-900 text-xl flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" aria-hidden /> Organiser console
        </h1>
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="admin-pass" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Admin password
          </label>
          <input id="admin-pass" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className={`${INPUT} w-full`} />
          <ErrorNote>{error}</ErrorNote>
          <button type="submit" className={`${PRIMARY} w-full py-2.5`}>
            Sign in
          </button>
        </form>
        <a href="#/" className="block text-xs text-slate-500 hover:underline">
          ← Back to the team site
        </a>
      </Card>
    </div>
  );
};

const Section = ({ title, children, actions }) => (
  <Card className="p-5 space-y-4 text-left">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-black text-slate-900">{title}</h2>
      {actions}
    </div>
    {children}
  </Card>
);

// ---------- event control ----------

const minutes = (sec) => Math.round(sec / 60);

// Labels read the configured round lengths, which organisers can change in "Round lengths".
const phaseActions = ({ r1, r2 }) => {
  const r1Min = minutes(r1.durationSec);
  const buyMin = minutes(r2.buySec);
  const solveMin = minutes(r2.solveSec);
  return {
    registration: [
      { phase: 'practice', label: 'Start practice round', secondary: true, confirm: 'Open the unscored practice round? Teams can still register.' },
      { phase: 'round1', label: `Start Round 1 (${r1Min} min)`, confirm: `Start Round 1 now? The ${r1Min}-minute timer starts for every team.` }
    ],
    practice: [{ phase: 'round1', label: `End practice, start Round 1 (${r1Min} min)`, confirm: `Start Round 1 now? Registration closes and the ${r1Min}-minute timer starts for every team.` }],
    round1: [{ phase: 'round1_closed', label: 'End Round 1 now', danger: true, confirm: 'End Round 1 immediately?' }],
    round1_closed: [{ phase: 'round2_buy', label: `Open Round 2 market (${buyMin} min)`, confirm: `Open the market? Buying lasts ${buyMin} minutes, then solving starts automatically.` }],
    round2_buy: [{ phase: 'round2_solve', label: 'End buying, start solving now', confirm: `Close the market early and start the ${solveMin}-minute solve?` }],
    round2_solve: [{ phase: 'round2_closed', label: 'End Round 2 now', danger: true, confirm: 'End Round 2 immediately?' }],
    round2_closed: [{ phase: 'round3', label: 'Start the final', confirm: 'Start Round 3? Lock the finalists first.' }],
    round3: [{ phase: 'finished', label: 'Finish the event', confirm: 'Mark the event finished?' }],
    finished: []
  };
};

const EventControl = ({ s, now, run }) => {
  const timer = s.timers[s.phase];
  const [manual, setManual] = useState(s.phase);
  const { r1, r2 } = s.config;
  return (
    <Section title="Event control">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-lg font-black text-slate-900">{PHASE_LABELS[s.phase]}</span>
        {timer && <Countdown endsAt={timer.endsAt} now={now} label="ends in" urgentBelow={60_000} />}
      </div>
      <div className="flex flex-wrap gap-2">
        {phaseActions(s.config)[s.phase].map((a) => (
          <button
            key={a.phase}
            type="button"
            className={a.danger ? DANGER : a.secondary ? SECONDARY : PRIMARY}
            onClick={() => window.confirm(a.confirm) && run('/admin/phase', { phase: a.phase })}
          >
            {a.label}
          </button>
        ))}
        {timer && (
          <>
            <button type="button" className={SECONDARY} onClick={() => run('/admin/extend', { seconds: 30 })}>
              +30 s
            </button>
            <button type="button" className={SECONDARY} onClick={() => run('/admin/extend', { seconds: 60 })}>
              +1 min
            </button>
            <button type="button" className={SECONDARY} onClick={() => run('/admin/extend', { seconds: -60 })}>
              −1 min
            </button>
            <button type="button" className={SECONDARY} onClick={() => run('/admin/extend', { seconds: 300 })}>
              +5 min
            </button>
            <button type="button" className={SECONDARY} onClick={() => run('/admin/extend', { seconds: -300 })}>
              −5 min
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Timed phases close by themselves: Round 1 after {minutes(r1.durationSec)} min, buying after {minutes(r2.buySec)} min
        (solving then starts), solving after {minutes(r2.solveSec)} min. The +/− buttons change the time left on a running timer.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-bold text-slate-600">Recovery: jump to any phase</summary>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <select value={manual} onChange={(e) => setManual(e.target.value)} className={INPUT}>
            {Object.keys(PHASE_LABELS).map((p) => (
              <option key={p} value={p}>
                {PHASE_LABELS[p]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={SECONDARY}
            onClick={() =>
              window.confirm(`Switch to "${PHASE_LABELS[manual]}"? Timed phases restart their full timer.`) &&
              run('/admin/phase', { phase: manual })
            }
          >
            Set phase
          </button>
        </div>
      </details>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={s.lateRegistration} onChange={(e) => run('/admin/late-registration', { enabled: e.target.checked })} />
        Allow new teams to register after registration closes
      </label>
    </Section>
  );
};

const DURATION_ROWS = [
  { phase: 'round1', label: 'Round 1', round: 'r1', field: 'durationSec' },
  { phase: 'round2_buy', label: 'Round 2 buying', round: 'r2', field: 'buySec' },
  { phase: 'round2_solve', label: 'Round 2 solving', round: 'r2', field: 'solveSec' }
];
const PHASE_ORDER = Object.keys(PHASE_LABELS);

const RoundLengths = ({ s, run }) => (
  <Section title="Round lengths">
    <p className="text-xs text-slate-500">
      Set each round’s length before it starts. Once a timer is running, use the +/− buttons in Event control instead.
    </p>
    <div className="flex flex-wrap gap-4">
      {DURATION_ROWS.map(({ phase, label, round, field }) => {
        const value = minutes(s.config[round][field]);
        const started = PHASE_ORDER.indexOf(s.phase) >= PHASE_ORDER.indexOf(phase);
        const set = (mins) => run('/admin/duration', { phase, minutes: mins });
        return (
          <div key={phase} className="text-sm flex items-center gap-2">
            <span className="font-semibold">{label}</span>
            <button type="button" className={SECONDARY} disabled={started || value <= 1} onClick={() => set(value - 1)} aria-label={`Shorten ${label} by 1 minute`}>
              −
            </button>
            <input
              key={value}
              type="number"
              min="1"
              max="120"
              disabled={started}
              defaultValue={value}
              onBlur={(e) => Number(e.target.value) !== value && set(Number(e.target.value))}
              className={`${INPUT} w-20 text-center`}
              aria-label={`${label} minutes`}
            />
            <button type="button" className={SECONDARY} disabled={started || value >= 120} onClick={() => set(value + 1)} aria-label={`Lengthen ${label} by 1 minute`}>
              +
            </button>
            <span className="text-xs text-slate-500">{started ? 'min · started' : 'min'}</span>
          </div>
        );
      })}
    </div>
  </Section>
);

const Prices = ({ s, run }) => {
  const locked = !['registration', 'practice', 'round1', 'round1_closed'].includes(s.phase);
  return (
    <Section title="Round 2 prices">
      <p className="text-xs text-slate-500">
        If the pilot shows Hard is far too hard, lower its cost to 35. Prices lock when the market opens.
      </p>
      <div className="flex flex-wrap gap-4">
        {Object.entries(s.config.r2.levels).map(([level, l]) => (
          <label key={level} className="text-sm flex items-center gap-2 capitalize">
            {level}
            <input
              type="number"
              min="1"
              disabled={locked}
              defaultValue={l.cost}
              onBlur={(e) => Number(e.target.value) !== l.cost && run('/admin/r2-cost', { level, cost: Number(e.target.value) })}
              className={`${INPUT} w-20`}
            />
            <span className="text-xs text-slate-500 normal-case">coins → {l.points} pts, max {l.max}</span>
          </label>
        ))}
      </div>
    </Section>
  );
};

// ---------- teams & scores ----------

// Rankings stay private until published. The server enforces this; the console always sees everything.
const StandingsVisibility = ({ s, run }) => {
  const published = s.standingsPublished;
  const toggle = () => {
    const message = published
      ? 'Hide the standings? Teams and the projector will see "Scores will be revealed soon".'
      : 'Publish the standings? Everyone will see the Round 1, Round 2 and qualification rankings.';
    if (window.confirm(message)) run('/admin/standings-visibility', { published: !published });
  };
  return (
    <Section
      title="Leaderboard visibility"
      actions={
        <button type="button" className={published ? SECONDARY : PRIMARY} onClick={toggle}>
          {published ? 'Hide standings' : 'Publish standings'}
        </button>
      }
    >
      <p className="text-sm">
        {published ? (
          <span className="font-bold text-emerald-700">Published:</span>
        ) : (
          <span className="font-bold text-amber-700">Hidden:</span>
        )}{' '}
        {published
          ? 'everyone can see the Round 1, Round 2 and qualification rankings.'
          : 'teams and the projector see "Scores will be revealed soon". Each team still sees its own scores.'}
      </p>
      <p className="text-xs text-slate-500">
        Starting Round 3 makes the finalists and live final scores public automatically. While standings stay hidden,
        the final board lists tied finalists alphabetically and never shows qualification ranks.
      </p>
    </Section>
  );
};

const Teams = ({ s, run }) => {
  const rows = s.standings.qualification;
  const teamById = Object.fromEntries(s.teams.map((t) => [t.id, t]));
  return (
    <Section title={`Teams (${s.teams.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-2 pr-3 text-left">#</th>
              <th className="py-2 pr-3 text-left">Team</th>
              <th className="py-2 pr-3 text-left">Members (signed in)</th>
              <th className="py-2 pr-3 text-right">R1</th>
              <th className="py-2 pr-3 text-right">R1 time</th>
              <th className="py-2 pr-3 text-right">R2</th>
              <th className="py-2 pr-3 text-right">Coins</th>
              <th className="py-2 pr-3 text-right">Total</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const t = teamById[r.teamId];
              return (
                <tr key={r.teamId} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-mono">{r.rank}</td>
                  <td className="py-2 pr-3 font-semibold">
                    {r.name}
                    {r.tied && <span className="ml-2 text-[10px] font-bold uppercase text-amber-700">tied</span>}
                  </td>
                  <td className="py-2 pr-3 text-xs">
                    {t.members.map((m) => (
                      <span key={m} className={`mr-2 ${t.online.includes(m) ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                        {m}
                      </span>
                    ))}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">{r.r1.points}</td>
                  <td className="py-2 pr-3 text-right font-mono text-xs">{formatSeconds(r.r1.timeMs)}</td>
                  <td className="py-2 pr-3 text-right font-mono">{r.r2.points}</td>
                  <td className="py-2 pr-3 text-right font-mono">{r.r2.coinsSpent}</td>
                  <td className="py-2 pr-3 text-right font-mono font-black">{r.total}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      className="text-xs text-rose-600 hover:underline"
                      onClick={() =>
                        window.confirm(`Remove ${r.name}? Their sessions end and they disappear from the standings.`) &&
                        run('/admin/team/remove', { teamId: r.teamId })
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
};

const Corrections = ({ s, run }) => {
  const [form, setForm] = useState({ round: 'r1', teamId: '', delta: '', reason: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (await run('/admin/adjust', { ...form, delta: Number(form.delta) })) setForm((f) => ({ ...f, delta: '', reason: '' }));
  };
  return (
    <Section title="Score corrections (Rounds 1 and 2)">
      <form onSubmit={submit} className="flex flex-wrap gap-2 items-end">
        <select value={form.round} onChange={set('round')} className={INPUT} aria-label="Round">
          <option value="r1">Round 1</option>
          <option value="r2">Round 2</option>
        </select>
        <select value={form.teamId} onChange={set('teamId')} className={INPUT} aria-label="Team" required>
          <option value="">Team…</option>
          {s.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input type="number" value={form.delta} onChange={set('delta')} placeholder="±points" className={`${INPUT} w-28`} aria-label="Point change" required />
        <input value={form.reason} onChange={set('reason')} placeholder="Reason (required, kept in the log)" className={`${INPUT} flex-1 min-w-48`} aria-label="Reason" required />
        <button type="submit" className={PRIMARY}>
          Log correction
        </button>
      </form>
      {s.adjustments.length > 0 && (
        <ul className="text-xs space-y-1">
          {[...s.adjustments].reverse().map((a) => (
            <li key={a.id} className="text-slate-600">
              <span className="font-mono">{new Date(a.at).toLocaleTimeString()}</span> · {a.round.toUpperCase()} ·{' '}
              <strong>{a.teamName ?? 'removed team'}</strong> {a.delta > 0 ? `+${a.delta}` : a.delta} — {a.reason}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};

const tieGroups = (rows, key) => {
  const groups = [];
  rows.forEach((r) => {
    if (!r.tied) return;
    const last = groups.at(-1);
    if (last && key(last[0]) === key(r) && last.at(-1).rank === r.rank - 1) last.push(r);
    else groups.push([r]);
  });
  return groups;
};

const TieBreaks = ({ s, run }) => {
  const scopes = [
    { scope: 'qualification', title: 'Qualification', rows: s.standings.qualification, key: (r) => r.total, show: (r) => `${r.total} pts` },
    { scope: 'final', title: 'Final', rows: s.standings.final, key: (r) => r.score, show: (r) => `${r.score} pts` }
  ];
  return (
    <Section title="Sudden-death tie-breaks">
      <p className="text-xs text-slate-500">
        These teams are still level after every automatic tie-break. Play a sudden-death question, then mark winners in
        finishing order. Marked teams rank ahead of unmarked tied teams.
      </p>
      {scopes.map(({ scope, title, rows, key, show }) => {
        const groups = tieGroups(rows, key);
        const marked = s.suddenDeath[scope];
        return (
          <div key={scope} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">{title}</h3>
              {Object.keys(marked).length > 0 && (
                <button type="button" className="text-xs text-slate-500 hover:underline" onClick={() => run('/admin/sudden-death', { scope, clear: true })}>
                  Clear marks
                </button>
              )}
            </div>
            {groups.length === 0 ? (
              <p className="text-xs text-slate-400">No unresolved ties.</p>
            ) : (
              groups.map((g) => (
                <div key={g[0].teamId} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-xs text-slate-500">Ranks {g[0].rank}–{g.at(-1).rank} · {show(g[0])}:</span>
                  {g.map((r) => (
                    <button
                      key={r.teamId}
                      type="button"
                      disabled={r.teamId in marked}
                      className={SECONDARY}
                      onClick={() => run('/admin/sudden-death', { scope, teamId: r.teamId })}
                    >
                      {r.teamId in marked ? `${r.name} ✓` : `${r.name} won`}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        );
      })}
    </Section>
  );
};

// ---------- final ----------

const Finalists = ({ s, run }) => {
  const cut = s.config.r3.finalists;
  const locked = s.finalists.length > 0;
  const started = s.r3.log.length > 0;
  const [picked, setPicked] = useState(() => new Set(s.finalists));
  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <Section title="Finalists">
      <p className="text-xs text-slate-500">
        “Lock top {cut}” takes the first {cut} rows of the qualification table. Resolve ties at the cut first. To override, tick teams and lock the selection.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={PRIMARY}
          disabled={started}
          onClick={() => window.confirm(`Lock the top ${cut} teams as finalists?`) && run('/admin/finalists', {})}
        >
          Lock top {cut}
        </button>
        <button type="button" className={SECONDARY} disabled={started || picked.size === 0} onClick={() => run('/admin/finalists', { teamIds: [...picked] })}>
          Lock ticked teams ({picked.size})
        </button>
      </div>
      <ul className="grid sm:grid-cols-2 gap-1 text-sm">
        {s.standings.qualification.map((r) => (
          <li key={r.teamId} className="flex items-center gap-2">
            <input type="checkbox" id={`fin-${r.teamId}`} checked={picked.has(r.teamId)} disabled={started} onChange={() => toggle(r.teamId)} />
            <label htmlFor={`fin-${r.teamId}`} className={r.rank <= cut ? 'font-semibold' : 'text-slate-500'}>
              {r.rank}. {r.name} ({r.total})
            </label>
            {s.finalists.includes(r.teamId) && <span className="text-[10px] font-bold uppercase text-emerald-700">finalist</span>}
          </li>
        ))}
      </ul>
      {locked && <p className="text-xs text-emerald-700">{s.finalists.length} finalists locked.</p>}
    </Section>
  );
};

const FinalConsole = ({ s, now, run }) => {
  const cur = s.r3.current;
  const curQ = cur && s.questions.round3.find((q) => q.id === cur.questionId);
  const used = new Set([...s.r3.history.map((h) => h.questionId), cur?.questionId]);
  const unused = s.questions.round3.filter((q) => !used.has(q.id));
  const next = unused.find((q) => !q.reserve && !q.practice) ?? unused.find((q) => q.reserve);
  const nextPractice = unused.find((q) => q.practice);
  const [adj, setAdj] = useState({ teamId: '', delta: '', reason: '' });
  const canShow = !cur || ['done', 'void'].includes(cur.status);
  const live = s.phase === 'round3';
  const correctAnswer = curQ && (curQ.type === 'mcq' ? `${String.fromCharCode(65 + curQ.answer)}. ${curQ.options[curQ.answer]}` : curQ.answer);

  return (
    <div className="space-y-4">
      {!live && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Teams can only buzz once the phase is “Round 3”.</p>}
      <Section title="Host & judge console">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={PRIMARY} disabled={!canShow || !next} onClick={() => run('/admin/r3/show', { questionId: next.id })}>
            Show next question{next?.reserve ? ' (reserve)' : ''}
          </button>
          {s.r3.log.length === 0 && (
            <button type="button" className={SECONDARY} disabled={!canShow || !nextPractice} onClick={() => run('/admin/r3/show', { questionId: nextPractice.id })}>
              Show practice question (no points)
            </button>
          )}
          <button type="button" className={PRIMARY} disabled={cur?.status !== 'shown'} onClick={() => run('/admin/r3/open', {})}>
            Buzzers open
          </button>
          <button type="button" className={PRIMARY} disabled={cur?.status !== 'open'} onClick={() => run('/admin/r3/call', {})}>
            Name next team ({s.config.r3.answerSec} s)
          </button>
          <button type="button" className={SECONDARY} disabled={!cur || !['shown', 'open'].includes(cur.status)} onClick={() => run('/admin/r3/close', {})}>
            Close question (no one / move on)
          </button>
          <button
            type="button"
            className={DANGER}
            disabled={!cur || cur.status === 'void'}
            onClick={() => {
              const reason = window.prompt('Why is this question void? (e.g. buzzer order unreliable)');
              if (reason !== null) run('/admin/r3/void', { reason });
            }}
          >
            Void question
          </button>
        </div>

        {cur?.status === 'answering' && (
          <div className="rounded-2xl border-2 border-sky-300 bg-sky-50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-black text-sky-900 text-lg">{cur.answering && s.teams.find((t) => t.id === cur.answering.teamId)?.name} is answering</p>
              <Countdown endsAt={cur.answering.endsAt} now={now} size="lg" urgentBelow={3000} />
            </div>
            <p className="text-sm">
              Answer key: <strong className="font-mono">{correctAnswer}</strong>
            </p>
            <div className="flex gap-2">
              <button type="button" className={`${BTN} bg-emerald-600 text-white hover:bg-emerald-700`} onClick={() => run('/admin/r3/judge', { result: 'correct' })}>
                Correct (+{s.config.r3.correct})
              </button>
              <button type="button" className={DANGER} onClick={() => run('/admin/r3/judge', { result: 'wrong' })}>
                Wrong ({s.config.r3.wrong})
              </button>
              <button type="button" className={DANGER} onClick={() => run('/admin/r3/judge', { result: 'timeout' })}>
                Timeout ({s.config.r3.wrong})
              </button>
            </div>
          </div>
        )}
        {curQ && cur.status !== 'answering' && (
          <p className="text-sm text-slate-600">
            Answer key: <strong className="font-mono">{correctAnswer}</strong>
            {cur.status === 'open' && cur.attempts.length > 0 && ' · rebound available'}
          </p>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FinalQuestion round3={s.round3} now={now} />
        </div>
        <FinalBoard rows={s.standings.final} />
      </div>

      <Section title="Final score log">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run('/admin/r3/adjust', { ...adj, delta: Number(adj.delta) })) setAdj({ teamId: '', delta: '', reason: '' });
          }}
          className="flex flex-wrap gap-2"
        >
          <select value={adj.teamId} onChange={(e) => setAdj({ ...adj, teamId: e.target.value })} className={INPUT} required aria-label="Team">
            <option value="">Finalist…</option>
            {s.finalists.map((id) => (
              <option key={id} value={id}>
                {s.teams.find((t) => t.id === id)?.name}
              </option>
            ))}
          </select>
          <input type="number" value={adj.delta} onChange={(e) => setAdj({ ...adj, delta: e.target.value })} placeholder="±points" className={`${INPUT} w-28`} required aria-label="Point change" />
          <input value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} placeholder="Reason (e.g. dispute upheld)" className={`${INPUT} flex-1 min-w-48`} required aria-label="Reason" />
          <button type="submit" className={PRIMARY}>
            Log correction
          </button>
        </form>
        <ul className="text-xs space-y-1">
          {[...s.r3.log].reverse().map((l, i) => (
            <li key={i} className="text-slate-600">
              <span className="font-mono">{new Date(l.at).toLocaleTimeString()}</span> · <strong>{l.teamName}</strong>{' '}
              <span className={l.delta < 0 ? 'text-rose-600' : 'text-emerald-700'}>{l.delta > 0 ? `+${l.delta}` : l.delta}</span> — {l.reason}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
};

// ---------- question review ----------

const QuestionBank = ({ s }) => {
  const show = (q) => (q.type === 'mcq' ? `${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}` : `${q.answer}${q.tolerance ? ` (±${q.tolerance})` : ''}`);
  return (
    <Section title="Question bank (answers visible to organisers only)">
      <p className="text-xs text-slate-500">Loaded from {s.questionFile}. Edit that file and restart the server to change questions.</p>
      {['practice', 'round1', 'round2', 'round3'].filter((round) => s.questions[round]).map((round) => (
        <details key={round} className="text-sm">
          <summary className="cursor-pointer font-bold">
            {round === 'practice' ? 'Practice round' : round.replace('round', 'Round ')} ({s.questions[round].length})
          </summary>
          <ol className="mt-2 space-y-2">
            {s.questions[round].map((q, i) => (
              <li key={q.id} className="border-t border-slate-100 pt-2">
                <p className="text-xs text-slate-500">
                  {i + 1}. {q.id} {q.level && `· ${q.level}`} {q.domain && `· ${q.domain}`} {q.reserve && '· reserve'} {q.practice && '· practice'}
                </p>
                <p>{q.prompt}</p>
                {q.code && <pre className="bg-slate-900 text-slate-100 rounded-lg p-2 text-xs overflow-x-auto">{q.code}</pre>}
                <p className="text-xs">
                  Answer: <strong className="font-mono">{show(q)}</strong>
                </p>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </Section>
  );
};

// ---------- page ----------

const TABS = [
  { id: 'control', label: 'Event control' },
  { id: 'teams', label: 'Teams & scores' },
  { id: 'final', label: 'Final' },
  { id: 'questions', label: 'Questions' }
];

const Console = ({ onSignOut }) => {
  const { data: s, error, offset, refresh, connectionLost } = usePolledState('/admin/state', { admin: true, interval: 1000 });
  const now = useServerNow(offset, 250);
  const [tab, setTab] = useState('control');
  const [actionError, setActionError] = useState(null);

  // Returns true on success so forms can reset themselves.
  const run = async (path, body) => {
    setActionError(null);
    try {
      await api(path, { body, admin: true });
      await refresh();
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  };

  const signedOut = error?.status === 401;
  useEffect(() => {
    if (signedOut) {
      adminToken.set(null);
      onSignOut();
    }
  }, [signedOut, onSignOut]);

  if (!s) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 px-4 text-center">
        {connectionLost ? CONNECTION_LOST_TEXT : (error?.message ?? 'Loading…')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <ConnectionBanner lost={connectionLost} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-left">
            <p className="font-black text-slate-900">DTD Battleground · Organisers</p>
            <p className="text-xs text-slate-500">
              {PHASE_LABELS[s.phase]} · {s.teams.length} teams · leaderboard {s.standingsPublished ? 'published' : 'hidden'}
            </p>
          </div>
          <nav className="flex flex-wrap gap-1" aria-label="Console sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="flex flex-wrap gap-2">
            <a href="#/display" target="_blank" rel="noreferrer" className={`${SECONDARY} inline-flex items-center gap-1`}>
              <Monitor className="w-3.5 h-3.5" aria-hidden /> Projector
            </a>
            <button type="button" className={`${SECONDARY} inline-flex items-center gap-1`} onClick={() => downloadAdminFile('/admin/standings.csv', 'dtd-standings.csv').catch((e) => setActionError(e.message))}>
              <Download className="w-3.5 h-3.5" aria-hidden /> Score sheet
            </button>
            <button type="button" className={`${SECONDARY} inline-flex items-center gap-1`} onClick={() => downloadAdminFile('/admin/backup', 'dtd-backup.json').catch((e) => setActionError(e.message))}>
              <Download className="w-3.5 h-3.5" aria-hidden /> Backup
            </button>
            <button
              type="button"
              className={`${SECONDARY} inline-flex items-center gap-1`}
              onClick={async () => {
                await api('/admin/logout', { body: {}, admin: true }).catch(() => {});
                adminToken.set(null);
                onSignOut();
              }}
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {s.persistence?.status === 'degraded' && (
          <p className="flex items-center gap-2 text-sm text-rose-900 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
            State is not saving to disk. Recent changes remain in memory only. Check disk space and folder permissions; the server will retry automatically.
            {s.persistence.lastError ? ` Last error: ${s.persistence.lastError}` : ''}
          </p>
        )}
        {s.isSampleQuestions && (
          <p className="flex items-center gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden /> Running on SAMPLE questions. Put the reviewed bank in server/questions.json before the event.
          </p>
        )}
        {s.questionWarnings.map((w) => (
          <p key={w} className="text-xs text-amber-800 text-left">
            Question bank: {w}
          </p>
        ))}
        <ErrorNote>{actionError}</ErrorNote>

        {tab === 'control' && (
          <>
            <EventControl key={s.phase} s={s} now={now} run={run} />
            <RoundLengths s={s} run={run} />
            <Prices s={s} run={run} />
            <Section title="Danger zone">
              <button
                type="button"
                className={DANGER}
                onClick={() => {
                  const typed = window.prompt('This deletes every team, answer and score. Download a backup first. Type RESET to continue.');
                  if (typed !== null) run('/admin/reset', { confirm: typed });
                }}
              >
                Reset event
              </button>
            </Section>
          </>
        )}
        {tab === 'teams' && (
          <>
            <StandingsVisibility s={s} run={run} />
            <Teams s={s} run={run} />
            <Corrections s={s} run={run} />
            <TieBreaks s={s} run={run} />
          </>
        )}
        {tab === 'final' && (
          <>
            <Finalists key={s.finalists.join()} s={s} run={run} />
            {s.finalists.length > 0 && <FinalConsole s={s} now={now} run={run} />}
          </>
        )}
        {tab === 'questions' && <QuestionBank s={s} />}
      </main>
    </div>
  );
};

export const AdminDashboard = () => {
  const [signedIn, setSignedIn] = useState(() => Boolean(adminToken.get()));
  return signedIn ? <Console onSignOut={() => setSignedIn(false)} /> : <Login onDone={() => setSignedIn(true)} />;
};
