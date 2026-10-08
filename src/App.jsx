import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CTFProvider } from './context/CTFContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { ChallengesArena } from './pages/ChallengesArena';
import { ScoreboardPage } from './pages/ScoreboardPage';
import { TeamsDirectory } from './pages/TeamsDirectory';
import { SubmissionsLog } from './pages/SubmissionsLog';
import { AdminDashboard } from './pages/AdminDashboard';
import { InstagramIcon } from './components/Icons';

const MainApp = () => {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState('challenges');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  // If user is not yet registered / joined, show the clean Auth Landing Page
  if (!currentUser) {
    return <AuthPage onSuccess={() => setCurrentTab('challenges')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'challenges' && <ChallengesArena />}

        {currentTab === 'scoreboard' && <ScoreboardPage />}

        {currentTab === 'teams' && (
          <TeamsDirectory onOpenCreateTeam={() => setShowCreateTeamModal(true)} />
        )}

        {currentTab === 'submissions' && <SubmissionsLog />}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Clean Modern Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900">DTD — Decode The Data</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-800">Data Science Club</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://www.instagram.com/datascienceclubjntuh/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors flex items-center space-x-1"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
              <span>@datascienceclubjntuh</span>
            </a>
            <span className="text-slate-300">•</span>
            <span
              onClick={() => setCurrentTab('admin')}
              className="text-amber-800 font-semibold hover:underline cursor-pointer"
            >
              Admin Portal
            </span>
          </div>
        </div>
      </footer>

      {/* Quick Team Creation Modal if inside Teams Directory */}
      {showCreateTeamModal && (
        <CreateTeamQuickModal onClose={() => setShowCreateTeamModal(false)} />
      )}
    </div>
  );
};

// Quick Create Team Modal for when inside the app
const CreateTeamQuickModal = ({ onClose }) => {
  const { createTeam } = useAuth();
  const [participantName, setParticipantName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = createTeam({ participantName, teamName, password });
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-left">
        <h3 className="font-black text-slate-900 text-lg">Create a New Team</h3>
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Participant Name
            </label>
            <input
              type="text"
              required
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Team Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Create name of the team"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Team Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password of the team"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-slate-900 outline-hidden"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CTFProvider>
        <MainApp />
      </CTFProvider>
    </AuthProvider>
  );
}
