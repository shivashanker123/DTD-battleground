import React, { useState } from 'react';
import {
  Users,
  KeyRound,
  Check,
  AlertCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TeamsDirectory = ({ onOpenCreateTeam }) => {
  const { teams, currentUser, joinTeam } = useAuth();

  const [selectedTeamToJoin, setSelectedTeamToJoin] = useState(null);
  const [participantNameInput, setParticipantNameInput] = useState(currentUser?.name || '');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedTeamToJoin) return;
    const res = joinTeam({
      participantName: participantNameInput,
      teamName: selectedTeamToJoin.name,
      password: passcodeInput
    });

    if (res.success) {
      setSuccessMsg('Successfully joined squad!');
      setTimeout(() => {
        setSelectedTeamToJoin(null);
        setPasscodeInput('');
        setSuccessMsg('');
      }, 700);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
            <Users className="w-3.5 h-3.5 text-slate-700" />
            <span>Squad Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Registered Teams
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Join an existing squad using the team password.
          </p>
        </div>

        <button
          onClick={onOpenCreateTeam}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          Create a Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-extrabold text-slate-800 text-base">No Teams Created Yet</h3>
          <p className="text-xs text-slate-500">
            Click above to create your squad and invite teammates with your team password.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team, idx) => {
            const isUserTeam = currentUser?.teamId === team.id;

            return (
              <div
                key={team.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isUserTeam ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center">
                      {team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isUserTeam && (
                        <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                          Your Squad
                        </span>
                      )}
                      <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg mb-2">{team.name}</h3>

                  {/* Team Members List */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Roster ({team.members ? team.members.length : 0} members)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {team.members &&
                        team.members.map((member, mIdx) => (
                          <span
                            key={mIdx}
                            className="bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-lg font-medium"
                          >
                            {member}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Meta & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-slate-900 font-mono">{team.score || 0}</span>
                    <span className="text-[11px] text-slate-400 ml-1">pts</span>
                    <span className="text-slate-300 mx-1.5">•</span>
                    <span className="text-xs text-slate-500 font-semibold">{team.solvesCount || 0} solved</span>
                  </div>

                  {isUserTeam ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>Joined</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedTeamToJoin(team);
                        setPasscodeInput('');
                        setErrorMsg('');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Join Team
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Team Modal with Password input */}
      {selectedTeamToJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-slate-900 text-lg">
              Join "{selectedTeamToJoin.name}"
            </h3>
            <p className="text-xs text-slate-500">
              Enter your name and the team password to join this squad.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Participant Name *
                </label>
                <input
                  type="text"
                  required
                  value={participantNameInput}
                  onChange={(e) => setParticipantNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Team Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Enter team password"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeamToJoin(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Join Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
