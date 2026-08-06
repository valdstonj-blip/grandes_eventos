import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, LogOut, UserCheck } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
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
                GRANDES EVENTOS - OPERAÇÃO ROCK IN RIO 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex items-center gap-1">
              <div className="px-3 md:px-5 py-2 rounded-xl flex items-center gap-2 bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold text-[10px] md:text-xs uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-400" />
                <span>Ocorrências & Relatórios</span>
              </div>
            </nav>

            {session && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden lg:flex flex-col text-right">
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
                    className="p-2 sm:px-3 sm:py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sair</span>
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
              <p className="text-sm text-slate-100 font-black tracking-tight group-hover:text-sky-300 transition-colors uppercase">TEN. CORONEL MOREIRA</p>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div className="group">
              <p className="text-[10px] text-sky-400/80 font-black uppercase tracking-widest mb-1">SUBCHEFE DA PM/3</p>
              <p className="text-sm text-slate-100 font-black tracking-tight group-hover:text-sky-300 transition-colors uppercase">TEN. CORONEL SARMENTO</p>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div className="group">
              <p className="text-[10px] text-sky-400/80 font-black uppercase tracking-widest mb-1">OFICIAL ENCARREGADO</p>
              <p className="text-sm text-slate-100 font-black tracking-tight group-hover:text-sky-300 transition-colors uppercase">MAJOR CONSTÂNCIO</p>
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
