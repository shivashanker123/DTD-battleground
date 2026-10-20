import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, TimerOff, Lock, Play } from 'lucide-react';
import { useEvent, useServerNow } from '../context/EventContext';
import { AnswerForm, Card, Countdown, ErrorNote, QuestionBody, formatSeconds } from '../components/ui';

const TILE = {
  locked: 'bg-white border-slate-200 text-slate-700 hover:border-slate-900 hover:shadow-sm',
  active: 'bg-sky-600 border-sky-600 text-white ring-4 ring-sky-200',
  correct: 'bg-emerald-600 border-emerald-600 text-white',
  wrong: 'bg-rose-50 border-rose-200 text-rose-700',
  expired: 'bg-slate-100 border-slate-200 text-slate-400'
};

const TileIcon = ({ status }) => {
  const cls = 'w-4 h-4';
  if (status === 'correct') return <CheckCircle2 className={cls} aria-hidden />;
  if (status === 'wrong') return <XCircle className={cls} aria-hidden />;
  if (status === 'expired') return <TimerOff className={cls} aria-hidden />;
  if (status === 'active') return <Play className={cls} aria-hidden />;
  return <Lock className={`${cls} text-slate-400`} aria-hidden />;
};

const STATUS_TEXT = { locked: 'Not opened', active: 'Open now', correct: 'Correct', wrong: 'Wrong', expired: 'Time ran out' };

// With `practice`, the same screen runs the unscored warm-up on its own questions.
export const Round1Page = ({ practice = false }) => {
  const { state, offset, act } = useEvent();
  const now = useServerNow(offset);
  const [confirming, setConfirming] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const questions = (practice ? state.practice : state.round1) ?? [];
  const live = state.phase === (practice ? 'practice' : 'round1');
  const roundEnd = practice ? Infinity : state.timers.round1?.endsAt;
  const api = practice ? '/practice' : '/r1';
  const active = questions.find((q) => q.status === 'active');
  const myRow = state.myScores; // the team's own scores; visible even while standings are hidden
  const done = questions.filter((q) => ['correct', 'wrong', 'expired'].includes(q.status)).length;
  const canOpen = live && !active && roundEnd > now;

  const openQuestion = async (q) => {
    setError(null);
    setResult(null);
    try {
      await act(`${api}/open`, { questionId: q.id });
      setConfirming(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const submit = async (answer) => {
    const { correct } = await act(`${api}/submit`, { questionId: active.id, answer });
    setResult({ number: active.number, correct });
    if (correct) confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{practice ? 'Practice' : 'Round 1'}</p>
          <h1 className="text-3xl font-black text-slate-900">{practice ? 'Practice round' : 'Puzzle Sprint'}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {practice
              ? `Try the Round 1 controls. Same rules: ${state.config.r1.questionSec} seconds and one answer per question. Nothing here counts towards your score.`
              : `Open any tile. You get ${state.config.r1.questionSec} seconds and one answer. Correct answers score ${state.config.r1.points}. Ties go to the team with less total time on correct answers.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {live && !practice && roundEnd && <Countdown endsAt={roundEnd} now={now} label="Round ends" urgentBelow={60_000} />}
          <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono">
            {practice ? 'Practice' : `${myRow?.r1.points ?? 0} pts`} · {done}/{questions.length} done
          </div>
        </div>
      </div>

      {!live && !practice && (
        <Card className="p-5 text-left">
          <p className="font-bold text-slate-900">Round 1 is closed.</p>
          <p className="text-sm text-slate-600">
            Your team answered {myRow?.r1.correct ?? 0} correctly for {myRow?.r1.points ?? 0} points, with{' '}
            {formatSeconds(myRow?.r1.timeMs ?? 0)} total time on correct answers.
          </p>
        </Card>
      )}

      {result && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-semibold border ${
            result.correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {result.correct
            ? `Q${result.number} correct${practice ? ' (practice, no points).' : `: +${state.config.r1.points} points.`}`
            : `Q${result.number} was not correct.${practice ? ' (Practice, no points.)' : ' No points, and the answer is locked.'}`}
        </div>
      )}
      <ErrorNote>{error}</ErrorNote>

      {active && (
        <Card className="p-6 space-y-5 border-sky-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Q{active.number} · {active.domain}
              </p>
              <p className="text-xs text-slate-500">Opened by your team. Refreshing does not reset the timer.</p>
            </div>
            <Countdown endsAt={active.deadline} now={now} label="Time left" size="lg" />
          </div>
          <QuestionBody question={active} />
          <AnswerForm key={active.id} question={active} onSubmit={submit} disabled={active.deadline <= now} />
        </Card>
      )}

      <section aria-label="Round 1 questions">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {questions.map((q) => {
            const isConfirming = confirming === q.id;
            const clickable = q.status === 'locked' && canOpen;
            return (
              <button
                key={q.id}
                type="button"
                disabled={!clickable}
                onClick={() => setConfirming(isConfirming ? null : q.id)}
                className={`relative aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all disabled:cursor-default ${
                  TILE[q.status]
                } ${isConfirming ? 'ring-4 ring-slate-300 border-slate-900' : ''} ${
                  q.status === 'locked' && !canOpen ? 'opacity-60' : ''
                }`}
                aria-label={`Question ${q.number}: ${STATUS_TEXT[q.status]}`}
              >
                <span className="text-2xl font-black font-mono">Q{q.number}</span>
                <span className="flex items-center gap-1 text-[11px] font-semibold">
                  <TileIcon status={q.status} />
                  {STATUS_TEXT[q.status]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {confirming && canOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700 text-left">
              Opening <strong>Q{questions.find((q) => q.id === confirming)?.number}</strong> starts a{' '}
              {state.config.r1.questionSec}-second timer for your whole team. You can only have one question open.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => openQuestion(questions.find((q) => q.id === confirming))}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold"
              >
                Open and start timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
