import React from 'react';
import { Gamepad2, Trophy, BookOpen, LogOut } from 'lucide-react';
import { useEvent, useServerNow } from '../context/EventContext';
import { ConnectionBanner, Countdown, PHASE_LABELS } from './ui';

const TABS = [
  { id: 'play', label: 'Play', icon: Gamepad2 },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'rules', label: 'Rules', icon: BookOpen }
];

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { state, offset, me, signOut, connectionLost } = useEvent();
  const now = useServerNow(offset, 1000);
  const timer = state?.timers?.[state.phase];
  const myRow = me && state.standings.qualification.find((r) => r.teamId === me.teamId);
  const finalRow = me && state.standings.final.find((r) => r.teamId === me.teamId);
  const inFinal = ['round3', 'finished'].includes(state?.phase);
  const score = inFinal && finalRow ? finalRow.score : myRow?.total;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <ConnectionBanner lost={connectionLost} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <button type="button" className="flex flex-col text-left" onClick={() => setCurrentTab('play')}>
            <span className="font-black text-slate-900 tracking-tight text-lg">DTD Battleground</span>
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded self-start">
              Data Science Club
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCurrentTab(id)}
                aria-current={currentTab === id ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  currentTab === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">{PHASE_LABELS[state?.phase]}</span>
              {timer && timer.endsAt > now && <Countdown endsAt={timer.endsAt} now={now} size="sm" urgentBelow={60_000} />}
            </div>
            {me && (
              <div className="flex items-center gap-2">
                <div className="text-right leading-tight hidden sm:block">
                  <p className="text-xs font-extrabold text-slate-900">{me.member}</p>
                  <p className="text-[10px] font-semibold text-slate-500">Team: {me.teamName}</p>
                </div>
                <div className="bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg" title={inFinal ? 'Final score' : 'Round 1 + Round 2'}>
                  {score ?? 0} pts
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex md:hidden items-center gap-2 py-2 border-t border-slate-100 overflow-x-auto text-xs">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCurrentTab(id)}
              className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
                currentTab === id ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
          {timer && timer.endsAt > now && (
            <span className="ml-auto">
              <Countdown endsAt={timer.endsAt} now={now} size="sm" urgentBelow={60_000} />
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
