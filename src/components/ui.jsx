import React, { useState } from 'react';
import { Clock, Loader2, WifiOff } from 'lucide-react';
import { CONNECTION_LOST_TEXT, isConnectivityError } from '../connection';

export const PHASE_LABELS = {
  registration: 'Registration',
  practice: 'Practice round',
  round1: 'Round 1 · Puzzle Sprint',
  round1_closed: 'Round 1 finished',
  round2_buy: 'Round 2 · Buying',
  round2_solve: 'Round 2 · Solving',
  round2_closed: 'Round 2 finished',
  round3: 'Round 3 · Buzzer Final',
  finished: 'Event finished'
};

export const LEVEL_STYLES = {
  easy: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  hard: 'bg-rose-50 text-rose-800 border-rose-200'
};

export const formatClock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mmss = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return h ? `${h}:${mmss}` : mmss;
};

export const formatSeconds = (ms) => `${(ms / 1000).toFixed(1)} s`;

export const Card = ({ className = '', children }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-2xs ${className}`}>{children}</div>
);

export const Countdown = ({ endsAt, now, label, urgentBelow = 10_000, size = 'md' }) => {
  const left = endsAt - now;
  const urgent = left <= urgentBelow;
  const sizes = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-2xl sm:text-4xl px-4 py-2 sm:px-5 sm:py-3',
    xl: 'text-7xl px-6 py-4'
  };
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl font-mono font-bold tabular-nums border ${sizes[size]} ${
        urgent ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-800 border-slate-200'
      }`}
      role="timer"
      aria-label={label}
    >
      {size !== 'xl' && size !== 'lg' && <Clock className="w-3.5 h-3.5" aria-hidden />}
      {label && size !== 'xl' && (
        <span className="font-sans font-semibold text-slate-500 text-xs sm:text-sm whitespace-nowrap">{label}</span>
      )}
      <span>{formatClock(left)}</span>
    </div>
  );
};

export const QuestionBody = ({ question, large = false }) => (
  <div className="space-y-3 text-left select-none">
    <p className={`font-semibold text-slate-900 whitespace-pre-wrap ${large ? 'text-3xl leading-snug' : 'text-base'}`}>
      {question.prompt}
    </p>
    {question.code && (
      <pre
        className={`bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto font-mono-code select-none ${large ? 'text-2xl' : 'text-sm'}`}
      >
        {question.code}
      </pre>
    )}
  </div>
);


export const OptionList = ({ options, highlight, large = false }) => (
  <ol className={`grid gap-2 ${large ? 'sm:grid-cols-2 text-2xl' : 'text-sm'}`}>
    {options.map((opt, i) => (
      <li
        key={i}
        className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${
          highlight === i ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-200'
        }`}
      >
        <span className="font-mono font-bold text-slate-500">{String.fromCharCode(65 + i)}</span>
        <span>{opt}</span>
      </li>
    ))}
  </ol>
);

// One-shot answer form: MCQ options or a numeric box. The server rejects malformed input without using the attempt.
export const AnswerForm = ({ question, onSubmit, disabled, submitLabel = 'Submit answer' }) => {
  const [value, setValue] = useState(question.type === 'mcq' ? null : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const empty = question.type === 'mcq' ? value === null : String(value).trim() === '';

  const submit = async (e) => {
    e.preventDefault();
    if (empty || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(value);
    } catch (err) {
      // The typed answer stays in the box either way; say so when the network was the problem.
      setError(
        isConnectivityError(err)
          ? "Your answer wasn't sent because the event server couldn't be reached. It's still here — tap Submit again."
          : err.message
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {question.type === 'mcq' ? (
        <fieldset className="grid gap-2" disabled={disabled || busy}>
          <legend className="sr-only">Choose one option</legend>
          {question.options.map((opt, i) => (
            <label
              key={i}
              className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === i ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-400'
              }`}
            >
              <input type="radio" name="answer" className="sr-only" checked={value === i} onChange={() => setValue(i)} />
              <span className={`font-mono font-bold ${value === i ? 'text-slate-300' : 'text-slate-500'}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="numeric-answer">
            Your answer (number)
          </label>
          <input
            id="numeric-answer"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            disabled={disabled || busy}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 42 or 0.75"
            className="w-full px-3 py-2.5 text-base font-mono bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
          />
        </div>
      )}
      {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500">One submission only. It cannot be changed.</p>
        <button
          type="submit"
          disabled={disabled || busy || empty}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export const ErrorNote = ({ children }) =>
  children ? (
    <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
      {children}
    </p>
  ) : null;

export const EmptyNote = ({ title, children }) => (
  <Card className="p-8 text-center space-y-2">
    <h2 className="font-black text-slate-900 text-xl">{title}</h2>
    <div className="text-sm text-slate-600 max-w-lg mx-auto">{children}</div>
  </Card>
);

// Non-blocking connectivity warning. Rendered in normal flow (inside sticky headers where there is one),
// so the last known state and timers stay visible underneath.
export const ConnectionBanner = ({ lost, large = false }) =>
  lost ? (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 bg-amber-400 text-slate-900 font-bold text-center px-4 ${
        large ? 'text-3xl py-4' : 'text-sm py-2'
      }`}
    >
      <WifiOff className={large ? 'w-8 h-8' : 'w-4 h-4'} aria-hidden />
      <span>{CONNECTION_LOST_TEXT}</span>
    </div>
  ) : null;
