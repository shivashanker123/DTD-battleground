import React, { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { EventProvider, useEvent } from './context/EventContext';
import { Navbar } from './components/Navbar';
import { InstagramIcon } from './components/Icons';
import { Card, EmptyNote } from './components/ui';
import { EntryPage, LandingPage } from './pages/LandingPage';
import { Round1Page } from './pages/Round1Page';
import { Round2Page } from './pages/Round2Page';
import { Round3Page } from './pages/Round3Page';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DisplayPage } from './pages/DisplayPage';

const WaitingRoom = () => {
  const { state, me } = useEvent();
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <EmptyNote title="You’re registered. Round 1 hasn’t started yet.">
        This page switches to Round 1 by itself when the host starts it. Read the Rules tab while you wait.
      </EmptyNote>
      <Card className="p-5 text-left space-y-2">
        <p className="flex items-center gap-2 font-bold text-slate-900">
          <Users className="w-4 h-4" aria-hidden /> {me.teamName}
        </p>
        <p className="text-sm text-slate-600">
          Members ({me.members.length}/{state.config.maxTeamSize}): {me.members.join(', ')}
        </p>
        {me.members.length < state.config.maxTeamSize && (
          <p className="text-xs text-slate-500">
            Teammates join by choosing “Sign in to my team” with this team name and your passcode.
          </p>
        )}
      </Card>
    </div>
  );
};

const PlayPage = () => {
  const { state } = useEvent();
  switch (state.phase) {
    case 'registration':
      return <WaitingRoom />;
    // Distinct keys so nothing (like a practice result message) carries over into Round 1.
    case 'practice':
      return <Round1Page key="practice" practice />;
    case 'round1':
    case 'round1_closed':
      return <Round1Page key="round1" />;
    case 'round2_buy':
    case 'round2_solve':
    case 'round2_closed':
      return <Round2Page />;
    default:
      return <Round3Page />;
  }
};

const MainApp = () => {
  const { state, error, me } = useEvent();
  const [currentTab, setCurrentTab] = useState('play');

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 gap-2">
        {error ? error.message : <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading" />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-slate-900 selection:text-white">
      {me && <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />}
      {error && (
        <p role="alert" className="bg-amber-100 text-amber-900 text-sm text-center px-4 py-2">
          {error.message} Retrying…
        </p>
      )}
      <main className="flex-1 pb-16">
        {!me && <EntryPage />}
        {me && currentTab === 'play' && <PlayPage />}
        {me && currentTab === 'leaderboard' && <LeaderboardPage />}
        {me && currentTab === 'rules' && <LandingPage />}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">DTD Battleground</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-800">JNTUH Data Science Club</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/datascienceclubjntuh/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
              <span>@datascienceclubjntuh</span>
            </a>
            <span className="text-slate-300">•</span>
            <a href="#/admin" className="text-amber-800 font-semibold hover:underline">
              Organisers
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// #/admin is the organiser console; #/display is the projector screen. Everything else is the team app.
const useHashRoute = () => {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash.replace(/^#\/?/, '');
};

export default function App() {
  const route = useHashRoute();
  if (route === 'admin') return <AdminDashboard />;
  if (route === 'display') return <DisplayPage />;
  return (
    <EventProvider>
      <MainApp />
    </EventProvider>
  );
}
