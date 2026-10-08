import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('dtd_teams');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dtd_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('dtd_admin_auth') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('dtd_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dtd_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dtd_current_user');
    }
  }, [currentUser]);

  // Create a Team
  const createTeam = ({ participantName, teamName, password }) => {
    const pName = participantName.trim();
    const tName = teamName.trim();
    const pwd = password.trim();

    if (!pName || !tName || !pwd) {
      return { success: false, message: 'Please provide Participant Name, Team Name, and Password.' };
    }

    const existingTeam = teams.find((t) => t.name.toLowerCase() === tName.toLowerCase());
    if (existingTeam) {
      return { success: false, message: 'A team with this name already exists. Please pick another name or join it.' };
    }

    const newTeam = {
      id: `team-${Date.now()}`,
      name: tName,
      password: pwd,
      score: 0,
      solvesCount: 0,
      rank: teams.length + 1,
      members: [pName]
    };

    const newUser = {
      id: `user-${Date.now()}`,
      name: pName,
      teamId: newTeam.id,
      teamName: tName,
      score: 0,
      solves: [],
      rank: 1
    };

    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    setCurrentUser(newUser);

    return { success: true, user: newUser };
  };

  // Join an Existing Team
  const joinTeam = ({ participantName, teamName, password }) => {
    const pName = participantName.trim();
    const tName = teamName.trim();
    const pwd = password.trim();

    if (!pName || !tName || !pwd) {
      return { success: false, message: 'Please provide Participant Name, Team Name, and Password.' };
    }

    const targetTeam = teams.find((t) => t.name.toLowerCase() === tName.toLowerCase());
    if (!targetTeam) {
      return { success: false, message: `Team "${tName}" not found. Verify the exact name or create a new team.` };
    }

    if (targetTeam.password !== pwd) {
      return { success: false, message: 'Incorrect Team Password. Please check with your team members.' };
    }

    // Add member if not already in team
    const updatedMembers = targetTeam.members.includes(pName)
      ? targetTeam.members
      : [...targetTeam.members, pName];

    const updatedTeams = teams.map((t) =>
      t.id === targetTeam.id ? { ...t, members: updatedMembers } : t
    );

    const newUser = {
      id: `user-${Date.now()}`,
      name: pName,
      teamId: targetTeam.id,
      teamName: targetTeam.name,
      score: targetTeam.score || 0,
      solves: [],
      rank: targetTeam.rank || 1
    };

    setTeams(updatedTeams);
    setCurrentUser(newUser);

    return { success: true, user: newUser };
  };

  // Admin authentication
  const loginAdmin = (password) => {
    if (password === 'admin2026' || password === 'dsclub@2026') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('dtd_admin_auth', 'true');
      return { success: true };
    }
    return { success: false, message: 'Invalid Admin Password.' };
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('dtd_admin_auth');
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        teams,
        setTeams,
        createTeam,
        joinTeam,
        isAdminAuthenticated,
        loginAdmin,
        logoutAdmin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
