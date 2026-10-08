import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Zap,
  Clock
} from 'lucide-react';
import { useCTF } from '../context/CTFContext';

export const SubmissionsLog = () => {
  const { submissions } = useCTF();
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'ACCEPTED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = submissions.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.userName.toLowerCase().includes(q) ||
        s.teamName.toLowerCase().includes(q) ||
        s.challengeTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Real-time Tournament Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Live Submissions & Solve Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time verification log of decoded keys across all colleges and teams.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACCEPTED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'ACCEPTED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilterStatus('REJECTED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'REJECTED' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>No submission records match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Challenge</th>
                  <th className="py-3 px-4 text-center">Score Delta</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const isSuccess = item.status === 'ACCEPTED';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>{item.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.userName}</td>

                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
                          {item.teamName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <div>{item.challengeTitle}</div>
                        {isSuccess && (
                          <div className="mt-1">
                            {item.hintsUsed > 0 ? (
                              <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                {item.hintsUsed} Hint Used (-{item.penalty} pts penalty)
                              </span>
                            ) : (
                              <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                Clean Solve (0 Hints)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isSuccess ? (
                          <div>
                            <span className="font-bold text-emerald-600 font-mono">+{item.points} pts</span>
                            {item.penalty > 0 && (
                              <span className="block text-[10px] text-rose-600 font-mono">(-{item.penalty} pts hint)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">0 pts</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
