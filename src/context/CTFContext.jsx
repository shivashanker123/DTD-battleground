import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { INITIAL_CHALLENGES, INITIAL_CATEGORIES } from '../data/mockData';
import { useAuth } from './AuthContext';

const CTFContext = createContext(null);

export const CTFProvider = ({ children }) => {
  const { currentUser, setCurrentUser, teams, setTeams, users, setUsers } = useAuth();

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('dtd_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [challenges, setChallenges] = useState(() => {
    const saved = localStorage.getItem('dtd_challenges');
    return saved ? JSON.parse(saved) : INITIAL_CHALLENGES;
  });

  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem('dtd_submissions');
    return saved ? JSON.parse(saved) : [];
  });

  const [unlockedHints, setUnlockedHints] = useState(() => {
    const saved = localStorage.getItem('dtd_unlocked_hints');
    return saved ? JSON.parse(saved) : {};
  });

  // Event remaining countdown in seconds (default ~4 hours, 32 minutes)
  const [remainingSeconds, setRemainingSeconds] = useState(16345);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    localStorage.setItem('dtd_challenges', JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem('dtd_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('dtd_unlocked_hints', JSON.stringify(unlockedHints));
  }, [unlockedHints]);

  // Check if a challenge is solved by the current user or their team
  const isChallengeSolved = (challengeId) => {
    if (!currentUser) return false;
    // Check if user solved it
    if (currentUser.solves?.includes(challengeId)) return true;
    // Check team solves from accepted submissions
    if (currentUser.teamName) {
      return submissions.some(
        (s) => s.status === 'ACCEPTED' && s.teamName === currentUser.teamName && s.challengeId === challengeId
      );
    }
    return false;
  };

  // Submit answer
  const submitAnswer = (challengeId, keyInput) => {
    if (!currentUser) {
      return { success: false, message: 'You must be logged in to submit decoded keys.' };
    }

    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      return { success: false, message: 'Challenge not found.' };
    }

    if (!challenge.isReleased) {
      return { success: false, message: 'This challenge has not been released yet!' };
    }

    if (isChallengeSolved(challengeId)) {
      return { success: false, message: 'This challenge has already been solved by you or your team!' };
    }

    const cleanInput = keyInput.trim();
    const isCorrect = challenge.acceptedKeys.some(
      (validKey) => validKey.toLowerCase() === cleanInput.toLowerCase()
    );

    // Calculate penalty deductions for hints used on this challenge
    let penalty = 0;
    let hintsUsedCount = 0;
    challenge.hints?.forEach((h) => {
      const hintKey = `${currentUser.id}_${challengeId}_${h.id}`;
      if (unlockedHints[hintKey]) {
        penalty += h.cost || 0;
        hintsUsedCount += 1;
      }
    });

    const netPoints = Math.max(10, challenge.points - penalty);

    const submissionEntry = {
      id: `sub-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      teamName: currentUser.teamName || 'Solo',
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      status: isCorrect ? 'ACCEPTED' : 'REJECTED',
      points: isCorrect ? netPoints : 0,
      submittedKey: cleanInput,
      hintsUsed: isCorrect ? hintsUsedCount : 0,
      penalty: isCorrect ? penalty : 0
    };

    setSubmissions((prev) => [submissionEntry, ...prev]);

    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect Decoded Solution. Re-evaluate your analysis and verify your formatting!'
      };
    }

    // Correct answer!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // ignore
    }

    // Update current user
    const updatedUserSolves = [...(currentUser.solves || []), challengeId];
    const updatedUserScore = (currentUser.score || 0) + netPoints;
    const updatedUser = {
      ...currentUser,
      score: updatedUserScore,
      solves: updatedUserSolves
    };
    setCurrentUser(updatedUser);

    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
    );

    // Update team score if in a team
    if (currentUser.teamId) {
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === currentUser.teamId) {
            return {
              ...t,
              score: (t.score || 0) + netPoints,
              solvesCount: (t.solvesCount || 0) + 1
            };
          }
          return t;
        })
      );
    }

    // Increment challenge solve count
    setChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, solvesCount: c.solvesCount + 1 } : c))
    );

    const resultMessage =
      hintsUsedCount > 0
        ? `Decoded Successfully! +${netPoints} points awarded (${challenge.points} pts - ${penalty} pts penalty for ${hintsUsedCount} hint${hintsUsedCount > 1 ? 's' : ''} used).`
        : `Decoded Successfully! Full +${netPoints} points awarded (Clean Solve - Zero Hints Used!).`;

    return {
      success: true,
      pointsAwarded: netPoints,
      message: resultMessage
    };
  };

  // Unlock hint
  const unlockHint = (challengeId, hintId, cost) => {
    if (!currentUser) return false;
    const hintKey = `${currentUser.id}_${challengeId}_${hintId}`;
    if (unlockedHints[hintKey]) return true;

    setUnlockedHints((prev) => ({ ...prev, [hintKey]: true }));
    return true;
  };

  const isHintUnlocked = (challengeId, hintId) => {
    if (!currentUser) return false;
    const hintKey = `${currentUser.id}_${challengeId}_${hintId}`;
    return !!unlockedHints[hintKey];
  };

  // Admin functions
  const toggleChallengeRelease = (challengeId) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              isReleased: !c.isReleased,
              releaseTime: !c.isReleased ? 'Released Live' : 'Locked by Admin'
            }
          : c
      )
    );
  };

  const addChallenge = (newChall) => {
    const id = `chall-${Date.now()}`;
    const formatted = {
      ...newChall,
      id,
      likes: 0,
      dislikes: 0,
      solvesCount: 0,
      isReleased: newChall.isReleased ?? true
    };
    setChallenges((prev) => [...prev, formatted]);
  };

  const updateChallenge = (id, updatedFields) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
  };

  const deleteChallenge = (id) => {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  };

  const resetAllData = () => {
    localStorage.clear();
    setChallenges(INITIAL_CHALLENGES);
    setCategories(INITIAL_CATEGORIES);
    setSubmissions([]);
    setUnlockedHints({});
    window.location.reload();
  };

  return (
    <CTFContext.Provider
      value={{
        categories,
        challenges,
        submissions,
        remainingSeconds,
        formatCountdown,
        isChallengeSolved,
        submitAnswer,
        unlockHint,
        isHintUnlocked,
        toggleChallengeRelease,
        addChallenge,
        updateChallenge,
        deleteChallenge,
        resetAllData
      }}
    >
      {children}
    </CTFContext.Provider>
  );
};

export const useCTF = () => {
  const context = useContext(CTFContext);
  if (!context) throw new Error('useCTF must be used within a CTFProvider');
  return context;
};
