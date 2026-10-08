import React, { useState } from 'react';
import {
  X,
  Download,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  Table,
  Check,
  Send,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { InstagramIcon } from './Icons';
import { useCTF } from '../context/CTFContext';

export const ChallengeModal = ({ challenge, onClose }) => {
  const { isChallengeSolved, submitAnswer, unlockHint, isHintUnlocked, submissions } = useCTF();

  const [activeTab, setActiveTab] = useState('challenge'); // 'challenge' | 'solves'
  const [answerInput, setAnswerInput] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [confirmUnlockHintId, setConfirmUnlockHintId] = useState(null);
  const [likesCount, setLikesCount] = useState(challenge.likes || 18);
  const [liked, setLiked] = useState(false);
  const [instagramSimulated, setInstagramSimulated] = useState(false);

  const solved = isChallengeSolved(challenge.id);

  // Submissions for this specific challenge
  const challengeSolves = submissions.filter(
    (s) => s.challengeId === challenge.id && s.status === 'ACCEPTED'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answerInput.trim()) return;

    const res = submitAnswer(challenge.id, answerInput);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setAnswerInput('');
    } else {
      setFeedback({ type: 'error', message: 'Incorrect Decoded Solution. Check your calculations and formatting, then try again.' });
    }
  };

  const handleDownloadDataset = () => {
    if (!challenge.datasetContent && !challenge.datasetFileName) return;
    const blob = new Blob([challenge.datasetContent || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = challenge.datasetFileName || `${challenge.id}_dataset.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmHintUnlock = (hintId, cost) => {
    unlockHint(challenge.id, hintId, cost);
    setConfirmUnlockHintId(null);
  };

  const handleToggleLike = () => {
    if (!liked) {
      setLikesCount((prev) => prev + 1);
      setLiked(true);
    } else {
      setLikesCount((prev) => prev - 1);
      setLiked(false);
    }
  };

  const contentText = challenge.problemStatement || challenge.description || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Clean White Card Modal inspired by the reference CTF modal */}
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Tab Bar matching Image 1 & 2 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 pt-4 pb-0 bg-slate-50/50">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('challenge')}
              className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 ${
                activeTab === 'challenge'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Challenge
            </button>
            <button
              onClick={() => setActiveTab('solves')}
              className={`pb-3 font-semibold text-sm tracking-wide transition-all border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'solves'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{challengeSolves.length || challenge.solvesCount || 0} Solves</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors mb-2"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1 space-y-6">
          {activeTab === 'challenge' ? (
            <>
              {/* Challenge Title, Points & Rating (Matching Image 1 & 2 layout) */}
              <div className="text-center space-y-2 pt-1">
                <div className="flex items-center justify-center space-x-2">
                  <span
                    className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                      challenge.difficulty === 'Welcome'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : challenge.difficulty === 'Beginner'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : challenge.difficulty === 'Intermediate'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {challenge.difficulty}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {challenge.category}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {challenge.title}
                </h2>

                <div className="text-2xl font-black text-slate-900 font-mono">
                  {challenge.points} <span className="text-sm font-medium text-slate-500">pts</span>
                </div>

                {/* Likes / Rating */}
                <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                  <button
                    onClick={handleToggleLike}
                    className={`flex items-center space-x-1.5 px-2 py-1 rounded transition-colors ${
                      liked ? 'text-slate-900 font-bold bg-slate-100' : 'hover:text-slate-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{likesCount} (95% liked)</span>
                  </button>
                  <span className="flex items-center space-x-1 hover:text-slate-800 cursor-pointer">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>{challenge.dislikes || 0}</span>
                  </span>
                </div>
              </div>

              {/* Solved Banner if already completed */}
              {solved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 flex items-center space-x-3 text-sm">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <p className="font-bold">Challenge Solved!</p>
                    <p className="text-xs text-emerald-700">
                      You or your team has decoded this solution and secured {challenge.points} points.
                    </p>
                  </div>
                </div>
              )}

              {/* Challenge Description / Problem Statement */}
              <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-line bg-slate-50/70 p-4.5 rounded-xl border border-slate-200/80">
                {contentText}
              </div>

              {/* Special Welcome Track: Instagram Link */}
              {challenge.id === 'welcome-01' && (
                <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-pink-200 rounded-xl p-4.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                        <InstagramIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Data Science Club JNTUH Instagram</h4>
                        <p className="text-xs text-slate-500">Official Channel: @datascienceclubjntuh</p>
                      </div>
                    </div>

                    <a
                      href="https://www.instagram.com/datascienceclubjntuh/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto"
                    >
                      <span>Open Instagram Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-700 bg-white/90 p-3 rounded-lg border border-pink-100 leading-relaxed">
                    🔍 <strong>Challenge Directive:</strong> Search our official Instagram account (<strong>@datascienceclubjntuh</strong>). No clues are provided for this challenge. You must inspect our profile and posts yourself to discover the secret code!
                  </p>
                </div>
              )}

              {/* Dataset Download & In-Browser Table Preview (Matching Image 2 download button) */}
              {challenge.hasDataset && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleDownloadDataset}
                      className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>{challenge.datasetFileName || 'download_dataset.csv'}</span>
                    </button>

                    {challenge.sampleRows && challenge.sampleRows.length > 0 && (
                      <button
                        onClick={() => setShowDataPreview(!showDataPreview)}
                        className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                      >
                        <Table className="w-3.5 h-3.5 text-slate-600" />
                        <span>{showDataPreview ? 'Hide Data Preview' : 'Inspect Sample Data'}</span>
                      </button>
                    )}
                  </div>

                  {/* Interactive In-Browser Data Inspector */}
                  {showDataPreview && challenge.sampleRows && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center space-x-1">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
                          <span>Dataset Head (Preview)</span>
                        </span>
                        <span className="text-slate-400 text-[11px]">{challenge.sampleRows.length} rows previewed</span>
                      </div>
                      <div className="overflow-x-auto max-h-48 text-xs font-mono-code">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              {Object.keys(challenge.sampleRows[0]).map((col) => (
                                <th key={col} className="p-2 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {challenge.sampleRows.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                {Object.values(row).map((val, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="p-2 border-r border-slate-100 last:border-r-0 text-slate-800 whitespace-nowrap"
                                  >
                                    {String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Author & Formatting Note (Matching Image 1 & 2) */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <div>
                  <span className="font-semibold text-slate-700">Author:</span> {challenge.author}
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  Required Format: <span className="font-semibold text-slate-900">{challenge.flagFormat || 'DTD{...}'}</span>
                </div>
              </div>

              {/* Hints Accordion (No free clues - minus points penalty required) */}
              {challenge.hints && challenge.hints.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Analysis Hints ({challenge.hints.length})
                    </p>
                    <span className="text-[11px] text-rose-600 font-semibold">
                      ⚠️ Hints deduct penalty points
                    </span>
                  </div>

                  {challenge.hints.map((hint, idx) => {
                    const unlocked = isHintUnlocked(challenge.id, hint.id);
                    return (
                      <div key={hint.id} className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        {unlocked ? (
                          <div className="bg-amber-50 p-3.5 text-amber-950 border-l-4 border-amber-600 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                              <span>Hint #{idx + 1}</span>
                              <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-mono text-[10px]">
                                -{hint.cost} pts penalty applied
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed font-medium">{hint.text}</p>
                          </div>
                        ) : confirmUnlockHintId === hint.id ? (
                          <div className="bg-rose-50 p-3.5 border border-rose-200 space-y-2.5">
                            <div className="flex items-center justify-between text-rose-900 font-bold text-xs">
                              <span>⚠️ Point Deduction Warning</span>
                              <span className="font-mono text-rose-700">-{hint.cost} pts</span>
                            </div>
                            <p className="text-xs text-rose-700">
                              Unlocking this hint will permanently deduct <strong>{hint.cost} points</strong> from your score on this challenge.
                            </p>
                            <div className="flex items-center justify-end space-x-2 pt-1">
                              <button
                                onClick={() => setConfirmUnlockHintId(null)}
                                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleConfirmHintUnlock(hint.id, hint.cost)}
                                className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-2xs"
                              >
                                Accept Penalty & Unlock (-{hint.cost} pts)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 p-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-slate-700">
                              <HelpCircle className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold">
                                Hint #{idx + 1}
                              </span>
                              <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                -{hint.cost} pts
                              </span>
                            </div>

                            <button
                              onClick={() => setConfirmUnlockHintId(hint.id)}
                              className="text-slate-900 hover:text-rose-600 font-bold flex items-center space-x-1"
                            >
                              <span>Unlock Hint</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2.5 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-medium">{feedback.message}</span>
                </div>
              )}
            </>
          ) : (
            /* Solves Tab */
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Solvers for "{challenge.title}"
              </h3>
              {challengeSolves.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No teams have decoded this solution yet!</p>
                  <p className="text-xs text-slate-600 font-semibold mt-1">Be the first to claim First Blood!</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Participant</th>
                        <th className="p-3">Team</th>
                        <th className="p-3">Points</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {challengeSolves.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900">{s.userName}</td>
                          <td className="p-3 text-slate-600">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {s.teamName}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-emerald-600">+{s.points}</td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom: Decoded Solution Submission Field (Replaces cybersecurity flag label) */}
        {activeTab === 'challenge' && (
          <div className="border-t border-slate-200 p-4 bg-slate-50/70">
            {solved ? (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
                <span className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Decoded & Scored</span>
                </span>
                <span className="text-slate-500 text-[11px]">Points locked in scoreboard</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Enter Decoded Solution (e.g. DTD{...})"
                    className="w-full bg-white border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl px-4 py-2.5 text-sm font-mono-code text-slate-900 placeholder:text-slate-400 transition-all outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!answerInput.trim()}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition-all shadow-xs shrink-0 flex items-center space-x-1.5"
                >
                  <span>Submit Solution</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
