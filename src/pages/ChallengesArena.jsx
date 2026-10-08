import React, { useState } from 'react';
import {
  Check,
  Lock
} from 'lucide-react';
import { useCTF } from '../context/CTFContext';
import { useAuth } from '../context/AuthContext';
import { ChallengeModal } from '../components/ChallengeModal';

export const ChallengesArena = () => {
  const { categories, challenges, isChallengeSolved, remainingSeconds, formatCountdown } = useCTF();
  const { currentUser } = useAuth();

  const [selectedChallenge, setSelectedChallenge] = useState(null);

  // Calculate statistics
  const totalChallenges = challenges.length;
  const solvedCount = challenges.filter((c) => isChallengeSolved(c.id)).length;
  const completionPercentage = totalChallenges > 0 ? Math.round((solvedCount / totalChallenges) * 100) : 0;

  // Group challenges by category for the CTF grid (matching Image 3 layout)
  const getCategoryChallenges = (catId) => {
    return challenges.filter((c) => c.category === catId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Participant Status Bar */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Real Entered Participant Name & Team Name */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome, {currentUser ? currentUser.name : 'Participant'}!
            </h1>
            <p className="text-sm font-bold text-slate-600 mt-0.5">
              Team: <span className="text-slate-900">{currentUser?.teamName || 'Solo'}</span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Score</span>
              <span className="text-xl font-black text-slate-900">{currentUser?.score ?? 0}</span>
              <span className="text-[10px] text-slate-400 block">points</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Solved</span>
              <span className="text-xl font-black text-emerald-600">
                {solvedCount} <span className="text-xs text-slate-400">/ {totalChallenges}</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block">{completionPercentage}%</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
              <span className="text-sm font-mono font-bold text-slate-800">
                {formatCountdown(remainingSeconds)}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold block">Live Event</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Overall Progress</span>
            <span>{solvedCount} of {totalChallenges} challenges solved ({completionPercentage}%)</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, completionPercentage)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Directly below: CTF Challenge Categories Board (Matching Image 3 Layout, No search bar or filters!) */}
      <div className="space-y-8">
        {categories.map((category) => {
          const catChallenges = getCategoryChallenges(category.id);
          if (catChallenges.length === 0) return null;

          return (
            <div key={category.id} className="space-y-3">
              {/* Category Header (Matching lowercase format in Image 3 like "misc", "crypto", "forensics") */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-extrabold text-slate-700 tracking-wider font-mono">
                    {category.shortName || category.name.toLowerCase()}
                  </h3>
                  <span className="text-xs text-slate-400">({catChallenges.length})</span>
                </div>
                <span className="text-xs text-slate-400 hidden sm:inline">{category.description}</span>
              </div>

              {/* Challenge Cards Grid (Matching the block buttons in Image 3!) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                {catChallenges.map((challenge) => {
                  const isSolved = isChallengeSolved(challenge.id);
                  const isLocked = !challenge.isReleased;

                  return (
                    <button
                      key={challenge.id}
                      onClick={() => setSelectedChallenge(challenge)}
                      disabled={isLocked}
                      className={`group relative text-center p-4 rounded-xl transition-all duration-150 flex flex-col items-center justify-center min-h-[96px] ${
                        isSolved
                          ? /* Solved Card: Solid Green Box like the green buttons in Image 3 */
                            'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border border-emerald-500 cursor-pointer transform hover:-translate-y-0.5'
                          : isLocked
                          ? /* Locked Card */
                            'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75'
                          : /* Unsolved Card: Clean white card with crisp borders and points */
                            'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-400 cursor-pointer transform hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Solved checkmark or Lock icon */}
                      {isSolved ? (
                        <div className="absolute top-2 right-2">
                          <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-100" />
                        </div>
                      ) : isLocked ? (
                        <div className="absolute top-2 right-2">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ) : null}

                      {/* Challenge Title */}
                      <span
                        className={`text-xs sm:text-sm font-bold tracking-tight line-clamp-1 mb-1 ${
                          isSolved ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'
                        }`}
                      >
                        {challenge.title}
                      </span>

                      {/* Points badge (e.g. 50, 100, 200 as seen in Image 3) */}
                      <span
                        className={`text-sm sm:text-base font-extrabold font-mono ${
                          isSolved ? 'text-emerald-100' : 'text-slate-900'
                        }`}
                      >
                        {challenge.points}
                      </span>

                      {/* Solves count / Locked subtitle */}
                      <span
                        className={`text-[10px] mt-0.5 ${
                          isSolved
                            ? 'text-emerald-200 font-medium'
                            : isLocked
                            ? 'text-slate-400 font-medium'
                            : 'text-slate-400 font-medium'
                        }`}
                      >
                        {isSolved
                          ? 'SOLVED'
                          : isLocked
                          ? 'LOCKED'
                          : `${challenge.solvesCount || 0} solves`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Challenge Modal popup (Matching Screenshots 1, 2, 4) */}
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
        />
      )}
    </div>
  );
};
