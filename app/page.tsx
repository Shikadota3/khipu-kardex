'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';
// Importamos Image de Next.js para manejar los archivos de /public
import Image from 'next/image';
import WarehouseSimulator from '@/components/WarehouseSimulator';
import LoginGate from '@/components/LoginGate';

export default function Page() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Iniciando sistemas...');
  const [showSystem, setShowSystem] = useState(false);

  useEffect(() => {
    // 3000ms total / 100 steps = 30ms per step
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setShowSystem(true), 500);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    const statusMessages = [
      'Iniciando sistemas...',
      'Cargando base de datos...',
      'Verificando protocolos...',
      'Sincronizando nube...',
      'Preparando UI...',
      'Sistema listo.'
    ];

    let messageIndex = 0;
    const messageTimer = setInterval(() => {
      if (messageIndex < statusMessages.length - 1) {
        messageIndex++;
        setStatus(statusMessages[messageIndex]);
      } else {
        clearInterval(messageTimer);
      }
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(messageTimer);
    };
  }, []);

  return (
    <main className="min-h-screen">
      <AnimatePresence mode="wait">
        {!showSystem ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-[#0A0A0B] flex flex-col items-center justify-center p-4 font-sans overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2B579A]/10 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F97316]/5 rounded-full blur-[120px]" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 flex flex-col items-center max-w-md w-full"
            >
              <div className="relative mb-12 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="relative w-40 h-40 flex items-center justify-center"
                >
                  <Image 
                    src="/VAKHIPU.png" 
                    alt="KHIPU Logo"
                    width={160} 
                    height={160}
                    className="object-contain z-10"
                    priority
                  />
                  <div className="absolute inset-0 bg-[#2B579A]/20 blur-[40px] rounded-full" />
                </motion.div>
                
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-0 right-0 w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center shadow-lg shadow-[#F97316]/20 z-20"
                >
                  <Shield className="text-white" size={16} />
                </motion.div>
              </div>

              <div className="text-center mb-10 space-y-2">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  KHIPU<span className="text-[#2B579A]">.</span>OS
                </h1>
                <p className="text-[#666] text-[10px] font-bold uppercase tracking-[0.4em]">SISTEMA DE GESTIÓN AVANZADA</p>
              </div>

              <div className="w-full space-y-6">
                <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2B579A] to-[#F97316]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Loader2 className="text-[#2B579A] animate-spin" size={14} />
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{status}</span>
                  </div>
                  <span className="text-[12px] font-mono font-bold text-[#F97316]">{progress}%</span>
                </div>
              </div>
            </motion.div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <div className="text-[8px] font-mono text-white/10 uppercase tracking-[1em]">
                © 2026 KHIPU TECHNOLOGIES • ALL RIGHTS RESERVED
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="system"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoginGate>
              <WarehouseSimulator />
            </LoginGate>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}