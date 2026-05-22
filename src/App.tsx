/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Layout } from './components/Layout';
import { OcorrenciasDashboard } from './components/OcorrenciasDashboard';
import { FaltasDispensasDashboard } from './components/FaltasDispensasDashboard';
import { DashboardTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('ocorrencias');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'ocorrencias' ? (
        <OcorrenciasDashboard />
      ) : (
        <FaltasDispensasDashboard />
      )}
    </Layout>
  );
}
