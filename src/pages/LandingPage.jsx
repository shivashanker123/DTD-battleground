import React from 'react';
import { Zap, Coins, Bell, ShieldCheck } from 'lucide-react';
import { useEvent } from '../context/EventContext';
import { InstagramIcon } from '../components/Icons';
import { Card } from '../components/ui';
import { AuthPanel } from './AuthPage';

const SCHEDULE = [
  ['00:00–00:20', 'Check-in, seating, logins'],
  ['00:20–00:30', 'Rules briefing and practice'],
  ['00:30–01:00', 'Round 1: Puzzle Sprint'],
  ['01:00–01:05', 'Break, score check, Risk Market briefing'],
  ['01:05–01:09', 'Round 2 buying'],
  ['01:09–01:34', 'Round 2 solving'],
  ['01:34–01:44', 'Score check, finalists announced, buzzer practice'],
  ['01:44–02:14', 'Round 3: Buzzer Final'],
  ['02:14–02:20', 'Results and prizes']
];

const Section = ({ title, children }) => (
  <section className="space-y-3 text-left">
    <h2 className="text-xl font-black text-slate-900">{title}</h2>
    {children}
  </section>
);

// Compact sign-in screen for visitors; the full rules live in the Rules tab after sign-in.
export const EntryPage = () => (
  <div className="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-6">
    <div className="text-center space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">JNTUH Data Science Club</p>
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">DTD Battleground</h1>
      <p className="text-sm text-slate-600">A three-round team quiz: Puzzle Sprint, Risk Market, Buzzer Final.</p>
    </div>
    <AuthPanel />
  </div>
);

// Event overview and rules, shown as the Rules tab to signed-in teams.
export const LandingPage = () => {
  const { state } = useEvent();
  const cfg = state?.config;
  if (!cfg) return null;
  const { r1, r2, r3 } = cfg;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="space-y-5 text-left">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">JNTUH Data Science Club presents</p>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">DTD Battleground</h1>
          <div className="inline-block bg-slate-900 text-white font-extrabold text-lg px-4 py-2 rounded-xl tracking-wide">
            Decode The Data
          </div>
        </div>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
          A three-round team quiz for teams of {cfg.maxTeamSize}. Rounds 1 and 2 are qualifiers. The top {r3.finalists} teams
          play a buzzer final that starts from zero. About 2½ hours from check-in to prizes.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <Card className="p-4">
            <Zap className="w-5 h-5 text-sky-600" aria-hidden />
            <p className="font-bold text-slate-900 mt-2">Puzzle Sprint</p>
            <p className="text-xs text-slate-600">{state.counts.round1} questions, {r1.questionSec} s each, +{r1.points} per correct answer</p>
          </Card>
          <Card className="p-4">
            <Coins className="w-5 h-5 text-amber-500" aria-hidden />
            <p className="font-bold text-slate-900 mt-2">Risk Market</p>
            <p className="text-xs text-slate-600">{r2.startCoins} coins to buy blind questions worth {r2.levels.easy.points} / {r2.levels.medium.points} / {r2.levels.hard.points}</p>
          </Card>
          <Card className="p-4">
            <Bell className="w-5 h-5 text-rose-600" aria-hidden />
            <p className="font-bold text-slate-900 mt-2">Buzzer Final</p>
            <p className="text-xs text-slate-600">Top {r3.finalists} teams, scores reset, +{r3.correct} correct, {r3.wrong} wrong</p>
          </Card>
        </div>
      </div>

      <Section title="Round 1: Puzzle Sprint">
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>{Math.round(r1.durationSec / 60)} minutes. Every team gets the same {state.counts.round1} questions, shown as tiles Q1–Q{state.counts.round1}. Answer them in any order.</li>
          <li>A question’s text stays hidden until your team opens it. Opening starts a {r1.questionSec}-second timer that keeps running if you refresh.</li>
          <li>Your team can have one question open at a time, and gets one answer per question. Answers cannot be changed.</li>
          <li>Correct = {r1.points} points. Wrong or out of time = 0. Answers are multiple choice or a number.</li>
          <li>Ties go to the team with less total time (from opening to submitting) across its correct answers.</li>
          <li>Topics: logic and patterns, Python output, intro data science and AI, data interpretation, aptitude. They start easy and get harder.</li>
        </ul>
      </Section>

      <Section title="Round 2: Risk Market">
        <p className="text-sm text-slate-700">
          Each team gets {r2.startCoins} coins to buy questions it cannot see yet. You only see each question’s domain and difficulty.
          You have {Math.round(r2.buySec / 60)} minutes to buy, then {Math.round(r2.solveSec / 60)} minutes to solve.
        </p>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2">Level</th>
                <th className="px-4 py-2 text-right">Cost (coins)</th>
                <th className="px-4 py-2 text-right">Points if correct</th>
                <th className="px-4 py-2 text-right">Max per team</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(r2.levels).map(([name, l]) => (
                <tr key={name} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-semibold capitalize">{name}</td>
                  <td className="px-4 py-2 text-right font-mono">{l.cost}</td>
                  <td className="px-4 py-2 text-right font-mono">{l.points}</td>
                  <td className="px-4 py-2 text-right font-mono">{l.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>A wrong answer scores 0 and coins are not refunded. Leftover coins are worth nothing.</li>
          <li>You can return a question while buying is still open.</li>
          <li>Equal scores are broken by: whose last correct answer was submitted earlier, then fewer coins spent, then a sudden-death question.</li>
        </ul>
      </Section>

      <Section title="Round 3: Buzzer Final">
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>The top {r3.finalists} teams after Rounds 1 and 2 qualify and all start at 0. The final alone decides the winner.</li>
          <li>15 live questions, about 15 minutes. The host shows and reads each one, then says “Buzzers open”. Buzzing before that does nothing.</li>
          <li>The first team to buzz answers within {r3.answerSec} seconds after the host names it. Correct +{r3.correct}; wrong or timeout {r3.wrong} (totals can go negative).</li>
          <li>After a wrong answer or timeout, that team is out for the question and one rebound goes to a different team, with the same scoring.</li>
          <li>Ties in the final: sudden death between the tied teams. If still tied, the higher qualifier wins.</li>
          <li>Captains raise disputes before the next question.</li>
        </ul>
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Schedule">
          <Card className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <tbody>
                {SCHEDULE.map(([time, what]) => (
                  <tr key={time} className="border-t first:border-t-0 border-slate-100">
                    <td className="px-4 py-2 font-mono text-slate-500 whitespace-nowrap">{time}</td>
                    <td className="px-4 py-2">{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
        <Section title="Fair play">
          <ul className="space-y-2 text-sm text-slate-700">
            {[
              'Teams sit apart. Phones away during Rounds 1 and 2; volunteers invigilate.',
              'All answers are multiple choice or numeric, to avoid disputes.',
              'Score corrections are logged with a reason and never silently overwritten.',
              'Following our Instagram is an optional perk. It never affects scores or rank.'
            ].map((rule) => (
              <li key={rule} className="flex gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <a
            href="https://www.instagram.com/datascienceclubjntuh/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-pink-700 hover:underline"
          >
            <InstagramIcon className="w-4 h-4" /> @datascienceclubjntuh (optional, non-scoring)
          </a>
        </Section>
      </div>
    </div>
  );
};
