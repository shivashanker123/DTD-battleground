import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Coins, CheckCircle2, XCircle, ShoppingCart, Undo2 } from 'lucide-react';
import { useEvent, useServerNow } from '../context/EventContext';
import { AnswerForm, Card, Countdown, EmptyNote, ErrorNote, LEVEL_STYLES, QuestionBody } from '../components/ui';

const LEVELS = ['easy', 'medium', 'hard'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const Market = ({ state, round2, now, act }) => {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const { levels, startCoins } = state.config.r2;
  const buyEnds = state.timers.round2_buy?.endsAt;
  const open = state.phase === 'round2_buy' && buyEnds > now;

  const run = async (path, id) => {
    setBusy(id);
    setError(null);
    try {
      await act(path, { questionId: id });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const blockedReason = (item) => {
    const level = levels[item.level];
    if (round2.counts[item.level] >= level.max) return `Max ${level.max} ${item.level}`;
    if (level.cost > round2.coinsLeft) return 'Not enough coins';
    return null;
  };

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <Card className="p-5 grid gap-4 sm:grid-cols-4 text-left">
        <div className="sm:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Coins left</p>
          <p className="text-4xl font-black text-slate-900 flex items-center gap-2">
            <Coins className="w-7 h-7 text-amber-500" aria-hidden />
            {round2.coinsLeft}
            <span className="text-base font-semibold text-slate-400">/ {startCoins}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Leftover coins are worth nothing.</p>
        </div>
        {LEVELS.map((lvl) => (
          <div key={lvl} className={`rounded-xl border px-4 py-3 ${LEVEL_STYLES[lvl]}`}>
            <p className="text-xs font-bold uppercase tracking-wider">{cap(lvl)}</p>
            <p className="text-sm">
              {levels[lvl].cost} coins → <strong>{levels[lvl].points} pts</strong>
            </p>
            <p className="text-xs mt-1">
              Holding {round2.counts[lvl]} of max {levels[lvl].max}
            </p>
          </div>
        ))}
      </Card>

      <ErrorNote>{error}</ErrorNote>

      {LEVELS.map((lvl) => (
        <section key={lvl} className="space-y-3 text-left">
          <h2 className="font-black text-slate-900">{cap(lvl)} questions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {round2.catalog
              .filter((item) => item.level === lvl)
              .map((item) => {
                const reason = !item.owned && blockedReason(item);
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border-2 p-4 flex flex-col justify-between gap-3 ${
                      item.owned ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <span
                        className={`inline-block text-[11px] font-bold uppercase tracking-wider rounded-md border px-1.5 py-0.5 ${LEVEL_STYLES[lvl]}`}
                      >
                        {lvl}
                      </span>
                      <p className="font-bold mt-2">{item.domain}</p>
                      <p className={`text-xs ${item.owned ? 'text-slate-300' : 'text-slate-500'}`}>
                        {levels[lvl].cost} coins · {levels[lvl].points} pts if correct
                      </p>
                    </div>
                    {item.owned ? (
                      <button
                        type="button"
                        disabled={!open || busy === item.id}
                        onClick={() => run('/r2/return', item.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 disabled:opacity-50"
                      >
                        <Undo2 className="w-3.5 h-3.5" aria-hidden /> Owned · return
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!open || Boolean(reason) || busy === item.id}
                        onClick={() => run('/r2/buy', item.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" aria-hidden /> {reason || `Buy for ${levels[lvl].cost}`}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      ))}

      {/* On phones the wallet scrolls away, so keep a slim copy pinned to the bottom. */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-bold">
          <Coins className="w-4 h-4 text-amber-400" aria-hidden /> {round2.coinsLeft} coins left
        </span>
        <span className="font-mono text-xs text-slate-300">
          {LEVELS.map((lvl) => `${lvl[0].toUpperCase()} ${round2.counts[lvl]}/${levels[lvl].max}`).join(' · ')}
        </span>
      </div>
    </div>
  );
};

const Solving = ({ state, round2, act }) => {
  const owned = round2.catalog.filter((q) => q.owned);
  const solving = state.phase === 'round2_solve';
  const answered = owned.filter((q) => q.answered).length;

  if (!owned.length) {
    return (
      <EmptyNote title="Your team did not buy any questions">
        Round 2 scores nothing for your team. Your Round 1 score still counts towards qualification.
      </EmptyNote>
    );
  }

  const submit = (item) => async (answer) => {
    const { correct } = await act('/r2/submit', { questionId: item.id, answer });
    if (correct) confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
  };

  return (
    <div className="space-y-4 text-left">
      <p className="text-sm text-slate-600">
        {answered} of {owned.length} answered. Each question takes one answer. A wrong answer scores 0 and coins are not
        refunded.
      </p>
      {owned.map((item, i) => (
        <Card key={item.id} className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-slate-400">#{i + 1}</span>
              <span className={`text-[11px] font-bold uppercase tracking-wider rounded-md border px-1.5 py-0.5 ${LEVEL_STYLES[item.level]}`}>
                {item.level}
              </span>
              <span className="text-sm font-semibold text-slate-700">{item.domain}</span>
            </div>
            <span className="text-xs font-bold text-slate-500">{item.points} pts</span>
          </div>
          <QuestionBody question={item} />
          {item.answered ? (
            <p
              className={`flex items-center gap-2 text-sm font-semibold rounded-xl px-3 py-2 border ${
                item.correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {item.correct ? <CheckCircle2 className="w-4 h-4" aria-hidden /> : <XCircle className="w-4 h-4" aria-hidden />}
              {item.correct ? `Correct: +${item.points} points` : 'Not correct: 0 points'}
              {item.answeredBy && <span className="font-normal text-xs">(answered by {item.answeredBy})</span>}
            </p>
          ) : solving ? (
            <AnswerForm key={item.id} question={item} onSubmit={submit(item)} />
          ) : (
            <p className="text-sm text-slate-500">Not answered before time ran out.</p>
          )}
        </Card>
      ))}
    </div>
  );
};

export const Round2Page = () => {
  const { state, offset, act } = useEvent();
  const now = useServerNow(offset);
  const { round2, phase, timers } = state;
  const myRow = state.myScores; // the team's own scores; visible even while standings are hidden
  const buying = phase === 'round2_buy';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Round 2</p>
          <h1 className="text-3xl font-black text-slate-900">Risk Market</h1>
          <p className="text-sm text-slate-600 mt-1">
            {buying
              ? 'Spend your coins on questions you cannot see yet. You only know each one’s domain and difficulty.'
              : phase === 'round2_solve'
                ? 'Your questions are unlocked. Solve as many as you can before time runs out.'
                : 'Round 2 is over.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {buying && timers.round2_buy && (
            <Countdown endsAt={timers.round2_buy.endsAt} now={now} label="Buying ends" urgentBelow={30_000} />
          )}
          {phase === 'round2_solve' && timers.round2_solve && (
            <Countdown endsAt={timers.round2_solve.endsAt} now={now} label="Solving ends" urgentBelow={60_000} />
          )}
          <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono">
            {myRow?.r2.points ?? 0} pts · {myRow?.r2.coinsSpent ?? 0} coins spent
          </div>
        </div>
      </div>
      {buying ? <Market state={state} round2={round2} now={now} act={act} /> : <Solving state={state} round2={round2} act={act} />}
    </div>
  );
};
