import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Activity, FileText } from 'lucide-react';
import { DashboardTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header - Navy Military Design */}
      <header className="bg-[#0f172a] border-b border-sky-600/30 shadow-[0_4px_20px_rgba(0,0,0,0.1)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sky-600 p-2 rounded-lg shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-sky-300 to-white bg-clip-text text-transparent uppercase tracking-tight leading-none mb-0.5">
                <span className="hidden md:inline">Estado Maior Geral PM/3</span>
                <span className="md:hidden">EMG-PM/3</span>
              </h1>
              <p className="text-[10px] md:text-xs text-sky-300/80 font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase leading-tight">
                Grande Evento - Operações
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('ocorrencias')}
              className={`px-3 md:px-5 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 font-bold text-[10px] md:text-xs uppercase tracking-wider ${
                activeTab === 'ocorrencias'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Ocorrências</span>
              <span className="sm:hidden">Ocorr.</span>
            </button>
            <button
              onClick={() => setActiveTab('faltas-dispensas')}
              className={`px-3 md:px-5 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 font-bold text-[10px] md:text-xs uppercase tracking-wider ${
                activeTab === 'faltas-dispensas'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Faltas/Dispensas</span>
              <span className="sm:hidden">Faltas</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-slate-800 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row gap-4 md:gap-16">
            <div className="group">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">CHEFE DA PM/3</p>
              <p className="text-sm text-slate-100 font-bold tracking-tight group-hover:text-sky-400 transition-colors">TEN. CORONEL MOREIRA</p>
            </div>
            <div className="group">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">OFICIAL ENCARREGADO</p>
              <p className="text-sm text-slate-100 font-bold tracking-tight group-hover:text-sky-400 transition-colors">&nbsp;</p>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-800/30 px-4 py-2 rounded-full border border-slate-700">
            &copy; 2026 PM/3 • Dev.Fiel.26
          </div>
        </div>
      </footer>
    </div>
  );
};
