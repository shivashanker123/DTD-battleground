import React, { useState } from 'react';
import { useEvent } from '../context/EventContext';
import { Card, formatSeconds } from '../components/ui';
import { FinalBoard } from '../components/FinalLive';

const TABS = [
  { id: 'qualification', label: 'Qualification (R1 + R2)' },
  { id: 'round1', label: 'Round 1' },
  { id: 'round2', label: 'Round 2' },
  { id: 'final', label: 'Final' }
];

const COLUMNS = {
  qualification: [
    { label: 'R1', value: (r) => r.r1.points },
    { label: 'R2', value: (r) => r.r2.points },
    { label: 'Total', value: (r) => r.total, strong: true }
  ],
  round1: [
    { label: 'Correct', value: (r) => r.r1.correct },
    { label: 'Time on correct', value: (r) => formatSeconds(r.r1.timeMs) },
    { label: 'Points', value: (r) => r.r1.points, strong: true }
  ],
  round2: [
    { label: 'Correct / bought', value: (r) => `${r.r2.correct} / ${r.r2.bought}` },
    { label: 'Coins spent', value: (r) => r.r2.coinsSpent },
    { label: 'Points', value: (r) => r.r2.points, strong: true }
  ]
};

const TIE_NOTE = {
  qualification:
    'Ties: earlier last correct Round 2 answer, then fewer coins spent, then less Round 1 time, then a sudden-death question.',
  round1: 'Ties: less total time from opening to submitting correct answers.',
  round2: 'Ties: earlier last correct answer, then fewer coins spent.',
  final: 'Ties: sudden death between tied teams; if still tied, the higher qualifier wins.'
};

export const LeaderboardPage = () => {
  const { state, me } = useEvent();
  const [tab, setTab] = useState(() => (['round3', 'finished'].includes(state.phase) ? 'final' : 'qualification'));
  const rows = state.standings[tab];
  const cut = state.config.r3.finalists;
  const myId = me?.teamId;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <div className="text-left">
        <h1 className="text-3xl font-black text-slate-900">Leaderboard</h1>
        <p className="text-sm text-slate-600">{TIE_NOTE[tab]}</p>
      </div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              tab === t.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'final' ? (
        rows.length ? (
          <FinalBoard rows={rows} highlightTeamId={myId} />
        ) : (
          <Card className="p-8 text-slate-500">Finalists are announced after Round 2.</Card>
        )
      ) : !state.standingsPublished ? (
        <Card className="p-8 text-center space-y-1">
          <p className="font-black text-slate-900 text-lg">Scores will be revealed soon</p>
          <p className="text-sm text-slate-500">The organisers will publish the standings. Your own scores are on the Play tab.</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-slate-500">No teams yet.</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">{TABS.find((t) => t.id === tab).label} standings</caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Team</th>
                {COLUMNS[tab].map((c) => (
                  <th key={c.label} className="px-4 py-2 text-right whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <React.Fragment key={r.teamId}>
                  <tr className={`border-t border-slate-100 ${r.teamId === myId ? 'bg-amber-50 font-semibold' : ''}`}>
                    <td className="px-4 py-2 font-mono font-bold">{r.rank}</td>
                    <td className="px-4 py-2">
                      {r.name}
                      {r.tied && <span className="ml-2 text-[10px] font-bold uppercase text-amber-700">tied</span>}
                      {state.finalists.includes(r.teamId) && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">finalist</span>
                      )}
                    </td>
                    {COLUMNS[tab].map((c) => (
                      <td key={c.label} className={`px-4 py-2 text-right font-mono ${c.strong ? 'font-black' : ''}`}>
                        {c.value(r)}
                      </td>
                    ))}
                  </tr>
                  {tab === 'qualification' && r.rank === cut && rows.length > cut && (
                    <tr aria-hidden>
                      <td colSpan={2 + COLUMNS[tab].length} className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border-t-2 border-emerald-300">
                        Top {cut} qualify for the final
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
