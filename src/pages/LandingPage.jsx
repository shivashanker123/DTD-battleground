import React from 'react';
import {
  Users,
  ArrowRight,
  ShieldCheck,
  Clock,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = ({ onEnterArena, onOpenAuth, onNavigateTab }) => {
  const { teams } = useAuth();
  const { challenges } = useCTF();

  const topTeams = [...teams].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="space-y-16 py-8 sm:py-12 animate-fade-in">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span>DATA SCIENCE CLUB • ANNUAL FLAGSHIP EVENT 2026</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-none">
          DTD <span className="text-indigo-600">— Decode The Data</span>
        </h1>

        <p className="text-xl sm:text-2xl font-bold text-slate-700 max-w-3xl mx-auto tracking-tight">
          A CTF-Style Data Science Competition
        </p>

        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Forget traditional cybersecurity flags. Step into real-world datasets, hunt subtle statistical anomalies,
          reverse-engineer machine learning weights, and decode secret analytical tokens to dominate the leaderboard.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={onEnterArena}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-sm sm:text-base transition-all shadow-md shadow-indigo-100 flex items-center space-x-2"
          >
            <span>Enter Challenge Arena</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAuth}
            className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-extrabold border border-slate-300 rounded-xl text-sm sm:text-base transition-all shadow-2xs flex items-center space-x-2"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Form / Join a Team</span>
          </button>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-center shadow-xs">
            <span className="text-2xl font-black text-indigo-600">6 Tracks</span>
            <span className="text-xs text-slate-500 block mt-0.5">From EDA to Deep Learning</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-center shadow-xs">
            <span className="text-2xl font-black text-indigo-600">4 Difficulties</span>
            <span className="text-xs text-slate-500 block mt-0.5">Welcome to Advanced</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-center shadow-xs">
            <span className="text-2xl font-black text-indigo-600">Dynamic Score</span>
            <span className="text-xs text-slate-500 block mt-0.5">Team & Solo Leaderboards</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-center shadow-xs">
            <span className="text-2xl font-black text-indigo-600">Real Datasets</span>
            <span className="text-xs text-slate-500 block mt-0.5">CSV, JSON & Neural Weights</span>
          </div>
        </div>
      </section>

      {/* What is DTD & The CTF Experience */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Concept & Philosophy</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              What is DTD — Decode The Data?
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              In classical cybersecurity CTFs, players exploit memory or web servers to find text flags like <code className="text-pink-600 bg-pink-50 px-1 py-0.5 rounded">flag&#123;...&#125;</code>.
              In <strong>DTD</strong>, your target is data science truth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Download Dataset</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ingest raw telemetry, dirty registrations, medical trials, or neural weights.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Analyse & Model</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Run statistical checks, identify outlier IQR timestamps, or calculate model metrics.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Extract Decoded Key</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Format your mathematical findings into verifiable tokens like <code className="text-indigo-600">DTD&#123;KEY&#125;</code>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Score & Conquer</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Turn challenge boxes green, earn points for your squad, and rank up live!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Difficulty Tracks Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Skill Progression</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            4 Competitive Difficulty Tiers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Challenges are weighted by complexity, from platform warm-ups to deep neural investigations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Welcome */}
          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                🟢 Welcome Level
              </span>
              <span className="font-mono font-bold text-xs text-slate-400">20–50 pts</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Platform Warmup</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify Data Science Club Instagram handles, test CSV ingestion, and learn token submission flows.
            </p>
          </div>

          {/* Beginner */}
          <div className="bg-white rounded-2xl border-2 border-sky-200 p-6 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                🔵 Beginner
              </span>
              <span className="font-mono font-bold text-xs text-slate-400">50–150 pts</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Statistical Basics</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Basic statistics, outlier detection with IQR, simple string deduplication, and confusion matrix math.
            </p>
          </div>

          {/* Intermediate */}
          <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                🟡 Intermediate
              </span>
              <span className="font-mono font-bold text-xs text-slate-400">150–300 pts</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Analytical Depth</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pearson correlation matrices, median bucket imputation, feature importance in trees, and Word2Vec analogies.
            </p>
          </div>

          {/* Advanced */}
          <div className="bg-white rounded-2xl border-2 border-rose-200 p-6 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                🔴 Advanced
              </span>
              <span className="font-mono font-bold text-xs text-slate-400">300–500+ pts</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">AI & Deep Forensics</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Simpson’s paradox breakdowns, regression residual steganography, early stopping epochs, and Transformer attention matrices.
            </p>
          </div>
        </div>
      </section>

      {/* Event Schedule & Rules */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Clock className="w-5 h-5" />
              <h3 className="font-extrabold text-slate-900 text-xl">Event Schedule & Live Release</h3>
            </div>
            <div className="space-y-4 border-l-2 border-slate-200 pl-4 text-xs sm:text-sm">
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <p className="font-bold text-slate-900">10:00 AM — Opening Keynote & Track 1 Live</p>
                <p className="text-slate-500 text-xs mt-0.5">Welcome & Beginner tracks unlocked for all participants.</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <p className="font-bold text-slate-900">12:00 PM — Midday Drop: Intermediate Challenges</p>
                <p className="text-slate-500 text-xs mt-0.5">Feature engineering and correlation puzzles unlocked.</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500" />
                <p className="font-bold text-slate-900">02:00 PM — Advanced AI & Transformer Track</p>
                <p className="text-slate-500 text-xs mt-0.5">High-point challenges released by admins.</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-rose-600" />
                <p className="font-bold text-slate-900">04:00 PM — Scoreboard Freeze & Final Hour</p>
                <p className="text-slate-500 text-xs mt-0.5">Leaderboard freezes to build final suspense.</p>
              </div>
            </div>
          </div>

          {/* Rules & Integrity */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="flex items-center space-x-2 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-extrabold text-slate-900 text-xl">Rules & Scoring Integrity</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Team Collaboration:</strong> Teams can have 1 to 4 members. Once a member solves a challenge, points are awarded to the entire squad.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Hint Deductions:</strong> Hints can be unlocked voluntarily. Hint penalties reduce net points for that challenge.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tie-Breaking:</strong> In case of identical scores, teams with earlier last submission timestamps rank higher.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Fair Play:</strong> Sharing answer keys across opposing squads leads to disqualification.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Leaderboard Sneak-Peek */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Live Preview</span>
              <h3 className="text-2xl font-black tracking-tight text-white mt-1">Current Leaderboard Top 5</h3>
            </div>
            <button
              onClick={() => onNavigateTab('scoreboard')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-colors self-start sm:self-center"
            >
              View Full Standings →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {topTeams.map((team, idx) => (
              <div key={team.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
                <span className="text-xs text-amber-400 font-bold block">#{idx + 1}</span>
                <p className="font-extrabold text-white text-sm truncate mt-1">{team.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{team.college}</p>
                <p className="text-lg font-black text-emerald-400 font-mono mt-2">{team.score} pts</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4 pt-4">
        <h2 className="text-3xl font-extrabold text-slate-900">Ready to Decode The Data?</h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Form your squad, authenticate with your team password, and step into the challenge arena.
        </p>
        <button
          onClick={onEnterArena}
          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-base transition-all shadow-md shadow-indigo-100 inline-flex items-center space-x-2"
        >
          <span>Launch Challenge Arena</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
