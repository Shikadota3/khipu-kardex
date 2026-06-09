'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ShieldCheck, AlertCircle, LogIn, Database, Eye, EyeOff } from 'lucide-react';
import { StudentUser } from '@/lib/types';

interface LoginGateProps {
  children: React.ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('khipu_session') || !!sessionStorage.getItem('khipu_session');
    }
    return false;
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/users/init', { method: 'POST' }).catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Credenciales inválidas.');
        return;
      }

      const user: StudentUser = data.user;
      setIsAuthenticated(true);
      localStorage.setItem('khipu_session', JSON.stringify(user));
      sessionStorage.setItem('khipu_session', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('khipu_login', { detail: user }));
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050505] px-4">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=2600')] bg-cover bg-center opacity-60 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-transparent opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050505]"></div>
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 md:gap-20 py-10">
        
        {/* Left Side - hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden md:flex flex-1 text-white flex-col text-center md:text-left space-y-6"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 backdrop-blur-md rounded-full mb-4 w-fit">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 underline decoration-blue-500/50 underline-offset-4">Sistema de Gestión Khipu</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
            Simulador <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-blue-400">Kardex Khipu</span>
          </h1>
          <p className="text-white/60 text-lg font-light tracking-wide max-w-md">
            Inicia sesión para ingresar al sistema.
          </p>
          <div className="pt-10 flex flex-col items-start gap-4">
            <div className="flex items-center gap-4 group cursor-help">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={20} className="text-blue-400" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                Protección de datos
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile title */}
          <div className="md:hidden text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter text-white leading-none">
              Kardex <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400">Khipu</span>
            </h1>
            <p className="text-white/50 text-sm mt-2">Sistema de Gestión de Inventarios</p>
          </div>

          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-8 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full" />
            <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full" />

            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-4">Acceso_Sistema</h2>
              <div className="flex justify-center gap-5 mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 border border-white/10 rounded-full flex items-center justify-center text-white/40">
                  <Database size={18} />
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-400 bg-blue-500/10">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">Terminal de Control de Inventario</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 md:space-y-8">
              <div className="space-y-8 md:space-y-10">
                {/* Username */}
                <div className="relative group">
                  <label className="absolute -top-6 left-0 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] group-focus-within:text-blue-400 transition-colors">Identificador</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-transparent border-b border-white/10 text-white font-sans rounded-none px-0 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                    placeholder="Usuario o Identificador..."
                  />
                  <User className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-blue-500/50" size={16} />
                </div>

                {/* Password con show/hide */}
                <div className="relative group">
                  <label className="absolute -top-6 left-0 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] group-focus-within:text-blue-400 transition-colors">Clave de Seguridad</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent border-b border-white/10 text-white font-sans rounded-none px-0 pr-16 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                    placeholder="••••••••"
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-white/20 hover:text-white/60 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <Lock className="text-white/10 group-focus-within:text-blue-500/50" size={16} />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3"
                  >
                    <AlertCircle className="text-red-500 shrink-0" size={16} />
                    <p className="text-red-500 text-[10px] font-bold uppercase leading-tight">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 md:py-5 font-sans font-black text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white disabled:opacity-50 mt-8 md:mt-12"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Database className="animate-spin" size={18} />
                    Autenticando...
                  </span>
                ) : (
                  <>
                    Ingresar al Sistema
                    <LogIn size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                className="text-white/20 hover:text-white/50 text-[9px] uppercase font-bold tracking-widest transition-colors"
                onClick={() => alert('Contacte al administrador de TI para restablecer su clave.')}
              >
                ¿Problemas con sus credenciales?
              </button>
            </div>
          </div>

          <p className="mt-6 md:mt-10 text-center text-[10px] text-white/40 uppercase tracking-widest font-light">
            KHIPU © 2026 — <span className="text-white/20 font-bold italic">Secure Terminal v2.4</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}