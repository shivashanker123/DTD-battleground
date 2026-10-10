import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useEvent } from '../context/EventContext';

const INPUT =
  'w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-hidden transition-all text-slate-900 placeholder:text-slate-400';

// Create a team (registration only) or sign in to an existing one. Each team has up to 3 named members.
export const AuthPanel = () => {
  const { state, signIn, notice } = useEvent();
  const registrationOpen = state?.registrationOpen ?? true;
  const [mode, setMode] = useState(registrationOpen ? 'create' : 'join');
  const activeMode = registrationOpen ? mode : 'join';
  const [form, setForm] = useState({ member: '', teamName: '', passcode: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const teamSize = state?.config.maxTeamSize ?? 3;

  const change = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(activeMode, form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const tab = (id, label, disabled) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setMode(id);
        setError(null);
      }}
      className={`py-2.5 text-center text-sm font-bold rounded-lg transition-all disabled:opacity-40 ${
        activeMode === id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5 text-left">
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
        {tab('create', 'Register a team', !registrationOpen)}
        {tab('join', 'Sign in to my team')}
      </div>

      {notice && (
        <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">{notice}</p>
      )}
      {!registrationOpen && (
        <p className="text-xs text-slate-500">Registration is closed. Teammates can still sign in with the team passcode.</p>
      )}
      {error && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="member" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Your name
          </label>
          <input id="member" required autoComplete="name" value={form.member} onChange={change('member')} className={INPUT} />
        </div>
        <div>
          <label htmlFor="teamName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Team name
          </label>
          <input id="teamName" required value={form.teamName} onChange={change('teamName')} className={INPUT} />
        </div>
        <div>
          <label htmlFor="passcode" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Team passcode
          </label>
          <input
            id="passcode"
            type="password"
            required
            minLength={4}
            autoComplete={activeMode === 'create' ? 'new-password' : 'current-password'}
            value={form.passcode}
            onChange={change('passcode')}
            placeholder={activeMode === 'create' ? 'At least 4 characters' : undefined}
            className={INPUT}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
          <span>{activeMode === 'create' ? 'Register team' : 'Sign in'}</span>
          <ArrowRight className="w-4 h-4" aria-hidden />
        </button>
        <p className="text-xs text-slate-500 text-center">
          Up to {teamSize} members per team, sharing one passcode.
        </p>
      </form>
    </div>
  );
};
