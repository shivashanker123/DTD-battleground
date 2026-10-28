import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useEvent, useServerNow } from '../context/EventContext';
import { ErrorNote } from '../components/ui';
import { FinalBoard, FinalQuestion } from '../components/FinalLive';

export const Round3Page = () => {
  const { state, offset, act, me } = useEvent();
  const now = useServerNow(offset, 100);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isFinalist = state.finalists.includes(me.teamId);
  const current = state.round3?.current;
  const myBuzz = current?.buzzes.find((b) => b.teamId === me.teamId);
  const out = current?.attempts.some((a) => a.teamId === me.teamId);
  const buzzersOpen = current && ['open', 'answering'].includes(current.status);
  const canBuzz = state.phase === 'round3' && isFinalist && buzzersOpen && !out && !myBuzz;

  const buzz = async () => {
    if (!canBuzz || busy) return;
    setBusy(true);
    setError(null);
    try {
      await act('/r3/buzz', {});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  let buzzLabel = 'Wait for “Buzzers open”';
  if (out) buzzLabel = 'Out for this question';
  else if (myBuzz) buzzLabel = `Buzzed · #${myBuzz.position}`;
  else if (canBuzz) buzzLabel = 'BUZZ';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="text-left">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Round 3</p>
        <h1 className="text-3xl font-black text-slate-900">Buzzer Final</h1>
        <p className="text-sm text-slate-600 mt-1">
          {state.config.r3.finalists} finalists start from zero. Correct +{state.config.r3.correct} (rebound +{state.config.r3.reboundCorrect ?? 35}), wrong or timeout{' '}
          {state.config.r3.wrong}. You have {state.config.r3.answerSec} seconds once the host names your team.
        </p>
      </div>

      {!isFinalist && (
        <p className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-slate-700 text-left">
          Your team did not reach the final this time. Thanks for playing! Follow the final live below.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {isFinalist && state.phase === 'round3' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={buzz}
                disabled={!canBuzz || busy}
                className={`w-full rounded-3xl py-10 text-4xl sm:text-5xl font-black tracking-wide transition-transform flex items-center justify-center gap-4 ${
                  canBuzz
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white shadow-lg'
                    : myBuzz && !out
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Bell className="w-10 h-10" aria-hidden />
                {buzzLabel}
              </button>
              <p className="hidden md:block text-xs text-slate-500 text-center">Space bar also buzzes when this page has focus.</p>
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
          <FinalQuestion round3={state.round3} now={now} highlightTeamId={me.teamId} />
        </div>
        <div className="space-y-3">
          <h2 className="font-black text-slate-900 text-left">Final scoreboard</h2>
          <FinalBoard rows={state.standings.final} highlightTeamId={me.teamId} />
        </div>
      </div>
      <SpaceToBuzz onBuzz={buzz} enabled={canBuzz} />
    </div>
  );
};

// Keyboard buzzing so finalists can keep their eyes on the host.
const SpaceToBuzz = ({ onBuzz, enabled }) => {
  React.useEffect(() => {
    if (!enabled) return undefined;
    const handler = (e) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        onBuzz();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onBuzz, enabled]);
  return null;
};
