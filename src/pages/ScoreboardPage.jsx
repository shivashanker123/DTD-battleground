import React, { useState } from 'react';
import {
  Trophy,
  Users,
  User,
  Crown,
  Search,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ScoreboardPage = () => {
  const { teams, currentUser } = useAuth();
  const [searchFilter, setSearchFilter] = useState('');

  // Sorted teams by score
  const sortedTeams = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));

  const filteredTeams = sortedTeams.filter((t) => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        (t.members && t.members.some((m) => m.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const topThree = sortedTeams.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
          <Trophy className="w-3.5 h-3.5 text-slate-700" />
          <span>Live Competition Standings</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          DTD Scoreboard & Leaderboard
        </h1>
        <p className="text-sm text-slate-500">
          Real-time point progression and verified decoded keys.
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-extrabold text-slate-800 text-base">No Teams Registered Yet</h3>
          <p className="text-xs text-slate-500">
            Form your squad to submit answers and claim the #1 spot on the leaderboard!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Display (only if teams exist) */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2">
              {topThree[1] && (
                <div className="order-2 md:order-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-between text-center">
                  <div className="w-full flex justify-between items-center text-xs text-slate-400 mb-2">
                    <span className="font-bold text-slate-500">Rank #2</span>
                    <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">Silver</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-black text-xl flex items-center justify-center border border-slate-200 mb-2">
                    🥈
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">{topThree[1].name}</h3>
                  <div className="text-2xl font-black text-slate-900 mt-2">{topThree[1].score || 0} pts</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {topThree[1].solvesCount || 0} solved
                  </p>
                </div>
              )}

              {topThree[0] && (
                <div className="order-1 md:order-2 bg-slate-50 border-2 border-slate-900 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-between text-center transform md:-translate-y-2">
                  <div className="w-full flex justify-between items-center text-xs text-slate-900 mb-2">
                    <span className="font-bold">Rank #1</span>
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center mb-2">
                    👑
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">{topThree[0].name}</h3>
                  <div className="text-3xl font-black text-slate-900 mt-2">{topThree[0].score || 0} pts</div>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    {topThree[0].solvesCount || 0} challenges solved
                  </p>
                </div>
              )}

              {topThree[2] && (
                <div className="order-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-between text-center">
                  <div className="w-full flex justify-between items-center text-xs text-amber-800 mb-2">
                    <span className="font-bold text-amber-700">Rank #3</span>
                    <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                      Bronze
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 font-black text-xl flex items-center justify-center border border-amber-200 mb-2">
                    🥉
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">{topThree[2].name}</h3>
                  <div className="text-2xl font-black text-slate-900 mt-2">{topThree[2].score || 0} pts</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {topThree[2].solvesCount || 0} solved
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Registered Squads ({teams.length})
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search team..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 outline-hidden"
              />
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-16">Rank</th>
                    <th className="py-3.5 px-4">Team Name & Squad Members</th>
                    <th className="py-3.5 px-4 text-center">Solved</th>
                    <th className="py-3.5 px-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeams.map((team, index) => {
                    const rank = index + 1;
                    const isUserTeam = team.id === currentUser?.teamId;

                    return (
                      <tr
                        key={team.id}
                        className={`transition-colors ${
                          isUserTeam ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-4 px-4 text-center">
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {team.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-900 text-sm">{team.name}</span>
                                {isUserTeam && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-900 text-white">
                                    Your Team
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-xs mt-0.5">
                                Members: {team.members ? team.members.join(', ') : 'Solo'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-xs">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>{team.solvesCount || 0}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 text-base">
                          {team.score || 0} <span className="text-xs text-slate-400">pts</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
