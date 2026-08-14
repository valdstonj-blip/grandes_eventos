import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, LogOut, UserCheck, Users } from 'lucide-react';
import { DashboardTab } from '../types';
import { UserSession } from './Login';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  session?: UserSession | null;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, session, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header - Navy Military Design */}
      <header className="bg-[#0f172a] border-b border-sky-600/30 shadow-[0_4px_20px_rgba(0,0,0,0.1)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-4">
          
          {/* Top Row on Mobile / Left Section on Desktop */}
          <div className="flex items-center justify-between gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="bg-sky-600 p-2 sm:p-2.5 rounded-xl shadow-lg shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg md:text-xl font-black bg-gradient-to-r from-sky-300 to-white bg-clip-text text-transparent uppercase tracking-tight leading-none truncate">
                    EMG PM/3
                  </h1>
                  <span className="hidden sm:inline-block text-[9px] font-black text-sky-300 bg-sky-950/80 border border-sky-800/60 px-1.5 py-0.5 rounded uppercase">
                    Operações
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-sky-300/80 font-bold tracking-wider uppercase leading-tight truncate">
                  GRANDES EVENTOS - ROCK IN RIO 2026
                </p>
              </div>
            </div>

            {/* Mobile User / Logout Button */}
            {session && onLogout && (
              <div className="flex md:hidden items-center gap-1.5 shrink-0">
                <button
                  onClick={onLogout}
                  title="Sair do Sistema"
                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation & Desktop User Actions */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
            <nav className="grid grid-cols-2 md:flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl sm:rounded-2xl border border-slate-800/80 w-full md:w-auto shadow-inner">
              <button
                onClick={() => setActiveTab('ocorrencias')}
                className={`w-full md:w-auto px-3 sm:px-4 py-2 md:py-1.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === 'ocorrencias'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>Ocorrências</span>
              </button>

              <button
                onClick={() => setActiveTab('faltas-dispensas')}
                className={`w-full md:w-auto px-3 sm:px-4 py-2 md:py-1.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === 'faltas-dispensas'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Faltas & Efetivo</span>
              </button>
            </nav>

            {session && (
              <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-800 shrink-0">
                <div className="flex flex-col text-right">
                  <span className="text-[11px] font-black text-white leading-tight flex items-center gap-1 justify-end">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    {session.name}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-sky-400">
                    {session.role === 'admin' ? 'Administrador' : 'Operador'}
                  </span>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sair do Sistema"
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-slate-800 py-8 px-4 text-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 md:gap-12">
            <div className="group">
              <p className="text-[10px] text-sky-400/80 font-black uppercase tracking-widest mb-1">CHEFE DA PM/3</p>
              <p className="text-sm text-slate-100 font-black tracking-tight group-hover:text-sky-300 transition-colors uppercase">CORONEL CHRISTOPH</p>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div className="group">
              <p className="text-[10px] text-sky-400/80 font-black uppercase tracking-widest mb-1">SUBCHEFE DA PM/3</p>
              <p className="text-sm text-slate-100 font-black tracking-tight group-hover:text-sky-300 transition-colors uppercase">TEN. CORONEL SARMENTO</p>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div className="group">
              <p className="text-[10px] text-sky-400/80 font-black uppercase tracking-widest mb-1">OFICIAL ENCARREGADO</p>
              <p className="text-sm text-slate-100 font-black tracking-tight group-hover:text-sky-300 transition-colors uppercase">CAPITÃO TRAVAGLIA</p>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
            &copy; 2026 PM/3 • Dev.Fiel.26
          </div>
        </div>
      </footer>
    </div>
  );
};
