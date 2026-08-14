/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { OcorrenciasDashboard } from './components/OcorrenciasDashboard';
import { FaltasDispensasDashboard } from './components/FaltasDispensasDashboard';
import { Login, UserSession } from './components/Login';
import { DashboardTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('ocorrencias');
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
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} session={session} onLogout={handleLogout}>
      {activeTab === 'ocorrencias' ? (
        <OcorrenciasDashboard />
      ) : (
        <FaltasDispensasDashboard />
      )}
    </Layout>
  );
}

