import React from 'react';
import {
  Terminal,
  Trophy,
  Users,
  History,
  ShieldAlert,
  Clock,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCTF } from '../context/CTFContext';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { currentUser, logout } = useAuth();
  const { challenges, isChallengeSolved, remainingSeconds, formatCountdown } = useCTF();

  const totalChallenges = challenges.length;
  const solvedCount = challenges.filter((c) => isChallengeSolved(c.id)).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Event Title: DTD — Decode The Data, highlighting dark Data Science Club, no D box */}
          <div
            className="flex flex-col cursor-pointer text-left"
            onClick={() => setCurrentTab('challenges')}
          >
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900 tracking-tight text-lg">
                DTD — Decode The Data
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                Data Science Club
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setCurrentTab('challenges')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentTab === 'challenges'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Challenges</span>
            </button>
            <button
              onClick={() => setCurrentTab('scoreboard')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentTab === 'scoreboard'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Scoreboard</span>
            </button>
            <button
              onClick={() => setCurrentTab('teams')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentTab === 'teams'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Teams</span>
            </button>
            <button
              onClick={() => setCurrentTab('submissions')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentTab === 'submissions'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Live Feed</span>
            </button>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentTab === 'admin'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Admin</span>
            </button>
          </nav>

          {/* Right Action Items: Timer, Solves Badge, Participant & Team info */}
          <div className="flex items-center space-x-3">
            {/* Live Countdown Timer */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-700" />
              <span>{formatCountdown(remainingSeconds)}</span>
            </div>

            {/* Solved Progress Counter */}
            {currentUser && (
              <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {solvedCount} / {totalChallenges} Solved
                </span>
              </div>
            )}

            {/* Real entered Participant Name and Team Name */}
            {currentUser && (
              <div className="flex items-center space-x-2">
                <div className="text-right leading-tight hidden sm:block">
                  <p className="text-xs font-extrabold text-slate-900">{currentUser.name}</p>
                  <p className="text-[10px] font-semibold text-slate-500">Team: {currentUser.teamName}</p>
                </div>
                <div className="bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
                  {currentUser.score} pts
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav row */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100 overflow-x-auto text-xs space-x-2">
          <button
            onClick={() => setCurrentTab('challenges')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              currentTab === 'challenges' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Challenges
          </button>
          <button
            onClick={() => setCurrentTab('scoreboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              currentTab === 'scoreboard' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Scoreboard
          </button>
          <button
            onClick={() => setCurrentTab('teams')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              currentTab === 'teams' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Teams
          </button>
          <button
            onClick={() => setCurrentTab('submissions')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              currentTab === 'submissions' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Live Feed
          </button>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              currentTab === 'admin' ? 'bg-amber-600 text-white' : 'text-slate-600'
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
};
