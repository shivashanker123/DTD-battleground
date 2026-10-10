import React from 'react';
import { Bell } from 'lucide-react';
import { Card, Countdown, OptionList, QuestionBody } from './ui';

const STATUS_TEXT = {
  shown: 'Host is reading the question. Wait for “Buzzers open”.',
  open: 'Buzzers are open!',
  answering: 'Answering…',
  done: 'Question closed.',
  void: 'Question voided. A reserve question will replace it.'
};

const answerText = (current) =>
  current.type === 'mcq' ? `${String.fromCharCode(65 + current.answer)}. ${current.options[current.answer]}` : current.answer;

// The live state of the current final question; used by finalists, spectators and the projector screen.
export const FinalQuestion = ({ round3, now, large = false, highlightTeamId }) => {
  const current = round3?.current;
  if (!current) {
    return (
      <Card className="p-8 text-center text-slate-500">
        {round3?.played ? `${round3.played} questions played. The next question is coming up.` : 'The final is about to begin.'}
      </Card>
    );
  }
  return (
    <Card className={`space-y-5 text-left ${large ? 'p-10' : 'p-6'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`font-black text-slate-400 font-mono ${large ? 'text-3xl' : 'text-lg'}`}>
          {current.practice ? 'Practice (no points)' : `Q${current.number}`}
        </p>
        <p
          className={`font-bold rounded-xl px-3 py-1.5 ${large ? 'text-2xl' : 'text-sm'} ${
            current.status === 'open' ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {STATUS_TEXT[current.status]}
        </p>
      </div>
      <QuestionBody question={current} large={large} />
      {current.type === 'mcq' && (
        <OptionList options={current.options} large={large} highlight={current.status === 'done' ? current.answer : undefined} />
      )}

      {current.answering && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-50 border border-sky-200 p-4">
          <p className={`font-black text-sky-900 ${large ? 'text-4xl' : 'text-xl'}`}>
            {current.answering.teamId === highlightTeamId ? 'Your team is answering' : `${current.answering.teamName} is answering`}
          </p>
          <Countdown endsAt={current.answering.endsAt} now={now} size={large ? 'xl' : 'lg'} urgentBelow={3000} />
        </div>
      )}

      {current.winner && (
        <p className={`font-black text-emerald-700 ${large ? 'text-4xl' : 'text-xl'}`}>{current.winner.teamName} got it right!</p>
      )}
      {current.answer !== undefined && current.type !== 'mcq' && (
        <p className={`font-bold text-slate-700 ${large ? 'text-3xl' : 'text-base'}`}>Answer: {answerText(current)}</p>
      )}

      {current.buzzes.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Buzz order</p>
          <ol className="flex flex-wrap gap-2">
            {current.buzzes.map((b) => {
              const out = current.attempts.some((a) => a.teamId === b.teamId);
              return (
                <li
                  key={b.teamId}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${large ? 'text-2xl' : 'text-sm'} ${
                    out
                      ? 'bg-rose-50 border-rose-200 text-rose-700 line-through'
                      : b.teamId === highlightTeamId
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200'
                  }`}
                >
                  <Bell className="w-4 h-4" aria-hidden />
                  <span className="font-mono font-bold">{b.position}</span>
                  <span className="font-semibold">{b.teamName}</span>
                  {b.afterMs !== null && <span className="text-xs opacity-70">+{(b.afterMs / 1000).toFixed(2)}s</span>}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
};

export const FinalBoard = ({ rows, highlightTeamId, large = false }) => (
  <Card className="overflow-hidden">
    <table className={`w-full text-left ${large ? 'text-2xl' : 'text-sm'}`}>
      <caption className="sr-only">Final scoreboard</caption>
      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
        <tr>
          <th className="px-4 py-2">#</th>
          <th className="px-4 py-2">Team</th>
          <th className="px-4 py-2 text-right">Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.teamId}
            className={`border-t border-slate-100 ${r.teamId === highlightTeamId ? 'bg-amber-50 font-bold' : ''}`}
          >
            <td className="px-4 py-2 font-mono font-bold">{r.rank}</td>
            <td className="px-4 py-2">
              {r.name}
              <span className="ml-2 text-xs text-slate-400">qualified #{r.qualifierRank}</span>
            </td>
            <td className={`px-4 py-2 text-right font-mono font-black ${r.score < 0 ? 'text-rose-600' : ''}`}>{r.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);
