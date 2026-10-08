import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  KeyRound,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'create_team' }) => {
  const { teams, register, login, users, switchDemoUser } = useAuth();

  const [activeTab, setActiveTab] = useState(initialMode); // 'create_team' | 'join_team' | 'solo' | 'login'
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    college: 'IIIT Hyderabad',
    teamName: '',
    teamPasscode: '',
    selectedTeamId: teams[0]?.id || '',
    loginIdentifier: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = register({
      name: formData.name,
      username: formData.username,
      email: formData.email,
      college: formData.college,
      mode: activeTab,
      teamName: formData.teamName,
      teamPasscode: formData.teamPasscode,
      selectedTeamId: formData.selectedTeamId
    });

    if (res.success) {
      setSuccessMsg('Account setup complete! Redirecting to Arena...');
      setTimeout(() => {
        onAuthSuccess();
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = login(formData.loginIdentifier);
    if (res.success) {
      setSuccessMsg(`Welcome back, ${res.user.name}! Redirecting...`);
      setTimeout(() => {
        onAuthSuccess();
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleQuickDemoPick = (user) => {
    switchDemoUser(user.id);
    setSuccessMsg(`Switched to demo profile: ${user.name}`);
    setTimeout(() => {
      onAuthSuccess();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
              <h3 className="font-extrabold text-slate-900 text-lg">DTD Platform Registration & Access</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Data Science Club 2026 • Form a squad, join teammates, or login
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-6 pt-3 pb-2 bg-slate-50/70 border-b border-slate-200">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('create_team');
                setErrorMsg('');
              }}
              className={`py-2 px-1 rounded-lg transition-all text-center ${
                activeTab === 'create_team'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Team
            </button>
            <button
              onClick={() => {
                setActiveTab('join_team');
                setErrorMsg('');
              }}
              className={`py-2 px-1 rounded-lg transition-all text-center ${
                activeTab === 'join_team'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Join Team
            </button>
            <button
              onClick={() => {
                setActiveTab('solo');
                setErrorMsg('');
              }}
              className={`py-2 px-1 rounded-lg transition-all text-center ${
                activeTab === 'solo'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solo Entry
            </button>
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
              }}
              className={`py-2 px-1 rounded-lg transition-all text-center ${
                activeTab === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username or Registered Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.loginIdentifier}
                    onChange={(e) => handleChange('loginIdentifier', e.target.value)}
                    placeholder="e.g. sai_k or sneha_r"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center space-x-2"
              >
                <span>Enter DTD Arena</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Instant 1-Click Demo Profiles */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Or instant login with demo accounts:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickDemoPick(u)}
                      className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-colors flex items-center space-x-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{u.teamName || 'Solo'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* Registration Form (Create Team, Join Team, or Solo) */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="e.g. rahul_ds"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="rahul@college.edu"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    College / University
                  </label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => handleChange('college', e.target.value)}
                    placeholder="e.g. IIIT Hyderabad / CBIT"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>
              </div>

              {/* Specific fields for Create Team */}
              {activeTab === 'create_team' && (
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Create a New Team & Set Access Passcode</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.teamName}
                      onChange={(e) => handleChange('teamName', e.target.value)}
                      placeholder="e.g. GradientDescenders, TensorTitans"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Team Password / Passcode *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={formData.teamPasscode}
                        onChange={(e) => handleChange('teamPasscode', e.target.value)}
                        placeholder="e.g. tensor2026 (share this with teammates to join)"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Teammates will need this exact password to join your team.
                    </p>
                  </div>
                </div>
              )}

              {/* Specific fields for Join Team */}
              {activeTab === 'join_team' && (
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <span>Join an Existing Team with Password</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Select Registered Team *
                    </label>
                    <select
                      value={formData.selectedTeamId}
                      onChange={(e) => handleChange('selectedTeamId', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-600 outline-hidden"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.college}) — {t.members.length} members
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Enter Team Passcode *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={formData.teamPasscode}
                        onChange={(e) => handleChange('teamPasscode', e.target.value)}
                        placeholder="Ask your captain for the team passcode"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Solo message */}
              {activeTab === 'solo' && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <p className="font-bold">Competing Individually</p>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    You will be ranked on the individual leaderboard. You can always form or join a team later.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center space-x-2 mt-2"
              >
                <span>
                  {activeTab === 'create_team'
                    ? 'Create Team & Enter Arena'
                    : activeTab === 'join_team'
                    ? 'Verify & Join Team'
                    : 'Register as Solo Participant'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
