import React from 'react';
import { usePolledState, useServerNow } from '../context/EventContext';
import { ConnectionBanner, Countdown, PHASE_LABELS } from '../components/ui';
import { CONNECTION_LOST_TEXT } from '../connection';
import { FinalBoard, FinalQuestion } from '../components/FinalLive';

// Projector screen for the hall: phase, big timer, live standings, and the final's question and buzz order.
export const DisplayPage = () => {
  const { data: state, error, offset, connectionLost } = usePolledState('/state', { interval: 700 });
  const now = useServerNow(offset, 200);
  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl text-slate-500">
        {connectionLost ? CONNECTION_LOST_TEXT : (error?.message ?? 'Connecting…')}
      </div>
    );
  }

  const timer = state.timers[state.phase];
  const inFinal = ['round3', 'finished'].includes(state.phase);
  const rows = state.standings.qualification.slice(0, 12);

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8">
      {connectionLost && (
        <div className="-mx-8 -mt-8">
          <ConnectionBanner lost large />
        </div>
      )}
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="text-left">
          <p className="text-xl font-bold uppercase tracking-wider text-slate-500">DTD Battleground</p>
          <h1 className="text-5xl font-black text-slate-900">{PHASE_LABELS[state.phase]}</h1>
        </div>
        {timer && timer.endsAt > now && <Countdown endsAt={timer.endsAt} now={now} size="xl" urgentBelow={60_000} />}
      </header>

      {state.phase === 'registration' && (
        <p className="text-3xl text-slate-700 text-left">
          {state.counts.teams} teams registered. Sign in on your device and wait for Round 1.
        </p>
      )}

      {inFinal ? (
        <div className="grid gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FinalQuestion round3={state.round3} now={now} large />
          </div>
          <FinalBoard rows={state.standings.final} large />
        </div>
      ) : !state.standingsPublished ? (
        state.phase !== 'registration' && (
          <p className="text-5xl font-black text-slate-700 text-center py-20">Scores will be revealed soon</p>
        )
      ) : (
        rows.length > 0 && (
          <table className="w-full text-2xl text-left bg-white rounded-2xl overflow-hidden border border-slate-200">
            <thead className="bg-slate-100 text-base uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Team</th>
                <th className="px-6 py-3 text-right">R1</th>
                <th className="px-6 py-3 text-right">R2</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.teamId} className={`border-t border-slate-100 ${r.rank <= state.config.r3.finalists ? '' : 'text-slate-400'}`}>
                  <td className="px-6 py-3 font-mono font-bold">{r.rank}</td>
                  <td className="px-6 py-3 font-semibold">{r.name}</td>
                  <td className="px-6 py-3 text-right font-mono">{r.r1.points}</td>
                  <td className="px-6 py-3 text-right font-mono">{r.r2.points}</td>
                  <td className="px-6 py-3 text-right font-mono font-black">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
};
