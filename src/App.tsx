/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { OcorrenciasDashboard } from './components/OcorrenciasDashboard';
import { Login, UserSession } from './components/Login';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('pm3_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLogin = (userSession: UserSession) => {
    setSession(userSession);
    localStorage.setItem('pm3_user_session', JSON.stringify(userSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('pm3_user_session');
  };

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab="ocorrencias" setActiveTab={() => {}} session={session} onLogout={handleLogout}>
      <OcorrenciasDashboard />
    </Layout>
  );
}

