import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Lock,
  Unlock,
  RotateCcw,
  KeyRound,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { useCTF } from '../context/CTFContext';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard = () => {
  const {
    challenges,
    categories,
    toggleChallengeRelease,
    addChallenge,
    deleteChallenge,
    submissions,
    resetAllData
  } = useCTF();
  const { teams, isAdminAuthenticated, loginAdmin, logoutAdmin } = useAuth();

  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [isAddingChallenge, setIsAddingChallenge] = useState(false);
  const [newChallForm, setNewChallForm] = useState({
    title: '',
    category: 'analysis',
    difficulty: 'Intermediate',
    points: 200,
    author: 'Data Science Club',
    description: '',
    flagFormat: 'DTD{token_here}',
    acceptedKey: '',
    isReleased: true,
    hasDataset: true,
    datasetFileName: 'sample_dataset.csv',
    datasetContent: 'id,metric_a,metric_b\n1,42.5,88.1',
    hintText: '',
    hintCost: 15
  });

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const res = loginAdmin(passwordInput.trim());
    if (!res.success) {
      setAuthError('Incorrect Admin Password. Access denied.');
    } else {
      setPasswordInput('');
    }
  };

  const handleFormChange = (field, val) => {
    setNewChallForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleCreateChallenge = (e) => {
    e.preventDefault();
    if (!newChallForm.title || !newChallForm.acceptedKey) return;

    addChallenge({
      title: newChallForm.title,
      category: newChallForm.category,
      difficulty: newChallForm.difficulty,
      points: Number(newChallForm.points),
      author: newChallForm.author,
      description: newChallForm.description,
      flagFormat: newChallForm.flagFormat,
      acceptedKeys: [newChallForm.acceptedKey.trim(), `DTD{${newChallForm.acceptedKey.trim()}}`],
      isReleased: newChallForm.isReleased,
      releaseTime: newChallForm.isReleased ? 'Released Live' : 'Scheduled Release',
      hasDataset: newChallForm.hasDataset,
      datasetFileName: newChallForm.datasetFileName,
      datasetContent: newChallForm.datasetContent,
      hints: newChallForm.hintText
        ? [{ id: 1, cost: Number(newChallForm.hintCost), text: newChallForm.hintText }]
        : []
    });

    setIsAddingChallenge(false);
    setNewChallForm({
      title: '',
      category: 'analysis',
      difficulty: 'Intermediate',
      points: 200,
      author: 'Data Science Club',
      description: '',
      flagFormat: 'DTD{token_here}',
      acceptedKey: '',
      isReleased: true,
      hasDataset: true,
      datasetFileName: 'sample_data.csv',
      datasetContent: '',
      hintText: '',
      hintCost: 15
    });
  };

  // If not authenticated as Admin, show Password Protection Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-2xl border border-slate-200 shadow-md text-left space-y-5 animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Admin Control Gate</h2>
            <p className="text-xs text-slate-500">Restricted to Data Science Club Coordinators</p>
          </div>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password (e.g. admin2026)"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Default password: <span className="font-mono font-bold text-slate-600">admin2026</span>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all"
          >
            Authenticate & Open Console
          </button>
        </form>
      </div>
    );
  }

  // Once authenticated as Admin
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Admin Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              DTD Competition Admin Console
            </h1>
            <p className="text-xs text-slate-600">
              Manage live challenge releases, add custom questions, inspect submissions, and reset states.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddingChallenge(!isAddingChallenge)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingChallenge ? 'Close Form' : 'Add New Challenge'}</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Reset all competition state to fresh data?')) {
                resetAllData();
              }
            }}
            className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
            title="Reset to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
          <button
            onClick={logoutAdmin}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-amber-100/60 rounded-xl transition-colors"
            title="Exit Admin Mode"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Challenges</span>
          <span className="text-2xl font-black text-slate-900">{challenges.length}</span>
          <span className="text-xs text-emerald-600 font-medium block mt-0.5">
            {challenges.filter((c) => c.isReleased).length} Live
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Squads</span>
          <span className="text-2xl font-black text-slate-900">{teams.length}</span>
          <span className="text-xs text-slate-500 font-medium block mt-0.5">
            {teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)} participants
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Submissions</span>
          <span className="text-2xl font-black text-slate-900">{submissions.length}</span>
          <span className="text-xs text-slate-500 font-medium block mt-0.5">
            {submissions.filter((s) => s.status === 'ACCEPTED').length} accepted
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Event Status</span>
          <span className="text-2xl font-black text-emerald-600">LIVE</span>
          <span className="text-xs text-emerald-700 font-medium block mt-0.5">
            Arena Accepting Submissions
          </span>
        </div>
      </div>

      {/* Add New Challenge Form */}
      {isAddingChallenge && (
        <div className="bg-white rounded-2xl border border-slate-300 p-6 shadow-sm space-y-4 animate-fade-in text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
              <Plus className="w-5 h-5 text-slate-900" />
              <span>Create New Challenge</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Instant Live Release</span>
          </div>

          <form onSubmit={handleCreateChallenge} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  required
                  value={newChallForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="e.g. Entropy Breakdown"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={newChallForm.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Difficulty Level *
                </label>
                <select
                  value={newChallForm.difficulty}
                  onChange={(e) => handleFormChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
                >
                  <option value="Welcome">🟢 Welcome (50 pts)</option>
                  <option value="Beginner">🔵 Beginner (100 pts)</option>
                  <option value="Intermediate">🟡 Intermediate (200 pts)</option>
                  <option value="Advanced">🔴 Advanced (350+ pts)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Points *
                </label>
                <input
                  type="number"
                  required
                  value={newChallForm.points}
                  onChange={(e) => handleFormChange('points', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Decoded Key *
                </label>
                <input
                  type="text"
                  required
                  value={newChallForm.acceptedKey}
                  onChange={(e) => handleFormChange('acceptedKey', e.target.value)}
                  placeholder="e.g. DTD{solution} or token"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Author Signature
                </label>
                <input
                  type="text"
                  value={newChallForm.author}
                  onChange={(e) => handleFormChange('author', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description & Instructions
              </label>
              <textarea
                rows={3}
                value={newChallForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe the problem and context..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingChallenge(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Publish Challenge
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Challenge Release Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">
              Live Challenge Release Controls
            </h2>
            <p className="text-xs text-slate-500">
              Toggle challenges between Released (Live) and Locked (Coming Soon) in real-time.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Challenge Name</th>
                <th className="p-3">Track</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Points</th>
                <th className="p-3">Solves</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challenges.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    {c.isReleased ? (
                      <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[11px]">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>Live</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold text-[11px]">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Locked</span>
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-bold text-slate-900">{c.title}</td>

                  <td className="p-3 font-mono text-slate-600">{c.category}</td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {c.difficulty}
                    </span>
                  </td>

                  <td className="p-3 font-mono font-bold text-slate-900">{c.points}</td>

                  <td className="p-3 text-slate-500 font-medium">{c.solvesCount} solves</td>

                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => toggleChallengeRelease(c.id)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                        c.isReleased
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {c.isReleased ? 'Lock' : 'Release Now'}
                    </button>
                    <button
                      onClick={() => deleteChallenge(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Challenge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
