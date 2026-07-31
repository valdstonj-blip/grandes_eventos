import React, { useState } from 'react';
import { Shield, Lock, User, KeyRound, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export interface UserSession {
  username: string;
  name: string;
  role: 'admin' | 'usuario';
}

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanUser === 'admin' && cleanPass === 'admin') {
      onLogin({
        username: 'admin',
        name: 'Administrador PM/3',
        role: 'admin',
      });
    } else if (cleanUser === 'usuario' && cleanPass === '123456') {
      onLogin({
        username: 'usuario',
        name: 'Operador PM/3',
        role: 'usuario',
      });
    } else {
      setError('Usuário ou senha incorretos. Verifique as credenciais.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Military Gradient Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 w-full max-w-md shadow-2xl z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400 mb-4 shadow-lg shadow-sky-500/10">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            EMG-PM/3 • Operações
          </h1>
          <p className="text-xs text-sky-400 font-bold uppercase tracking-widest mt-1">
            Grandes Eventos — Autenticação
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Usuário / Login
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Informe o usuário"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-sky-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
          >
            <Lock className="w-4 h-4" />
            Acessar Sistema
          </button>
        </form>
      </motion.div>
    </div>
  );
};
