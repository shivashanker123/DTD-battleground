import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const AuthPage = ({ onSuccess }) => {
  const { createTeam, joinTeam } = useAuth();
  const [activeMode, setActiveMode] = useState('create'); // 'create' | 'join'

  const [formData, setFormData] = useState({
    participantName: '',
    teamName: '',
    password: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.participantName.trim()) {
      setErrorMsg('Please enter your participant name.');
      return;
    }
    if (!formData.teamName.trim()) {
      setErrorMsg('Please enter the team name.');
      return;
    }
    if (!formData.password.trim()) {
      setErrorMsg('Please enter the team password.');
      return;
    }

    if (activeMode === 'create') {
      const res = createTeam({
        participantName: formData.participantName,
        teamName: formData.teamName,
        password: formData.password
      });
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = joinTeam({
        participantName: formData.participantName,
        teamName: formData.teamName,
        password: formData.password
      });
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Clean Branding */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              DTD — Decode The Data
            </h1>

            {/* Dark highlighted Data Science Club */}
            <div className="inline-block bg-slate-900 text-white font-extrabold text-lg sm:text-xl px-4 py-2 rounded-xl shadow-xs tracking-wide">
              Data Science Club
            </div>
          </div>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
            Welcome to the flagship competitive data challenge. Ingest real-world datasets, investigate anomalies, decode secret feature keys, and climb the live scoreboard with your squad.
          </p>

          <div className="pt-2 text-xs text-slate-400 font-medium space-y-1">
            <p>• Form a squad or join an existing squad with a team password</p>
            <p>• Solve data analysis, machine learning, and forensic challenges</p>
            <p>• Submit decoded tokens directly in the arena dashboard</p>
          </div>
        </div>

        {/* Right Side: Auth Box with only two boxes: Create a Team or Join a Team */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
            {/* The two top selector boxes */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('create');
                  setErrorMsg('');
                }}
                className={`py-2.5 text-center text-sm font-bold rounded-lg transition-all ${
                  activeMode === 'create'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Create a Team
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('join');
                  setErrorMsg('');
                }}
                className={`py-2.5 text-center text-sm font-bold rounded-lg transition-all ${
                  activeMode === 'join'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Join a Team
              </button>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Participant Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.participantName}
                  onChange={(e) => handleChange('participantName', e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-hidden transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.teamName}
                  onChange={(e) => handleChange('teamName', e.target.value)}
                  placeholder={activeMode === 'create' ? 'Create name of the team' : 'Enter team name to join'}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-hidden transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {activeMode === 'create' ? 'Create Password' : 'Team Password'}
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={activeMode === 'create' ? 'Create password of the team' : 'Enter team password'}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-hidden transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center space-x-2 pt-3"
              >
                <span>{activeMode === 'create' ? 'Create Team' : 'Join Team'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
