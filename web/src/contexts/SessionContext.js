import React, { createContext, useContext, useState } from 'react';

// List of available academic sessions (most recent first)
export const SESSIONS = [
  '2025-2026',
  '2024-2025',
  '2023-2024',
  '2022-2023',
  '2021-2022',
];

// Current/default session
export const CURRENT_SESSION = '2024-2025';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(
    () => localStorage.getItem('academic_session') || CURRENT_SESSION
  );

  const changeSession = (newSession) => {
    setSession(newSession);
    localStorage.setItem('academic_session', newSession);
  };

  return (
    <SessionContext.Provider value={{ session, changeSession, SESSIONS }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
export default SessionContext;
