'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchForm } from './components/SearchForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { OnboardingGuide } from './components/OnboardingGuide';
import type { ScanResult, ScanMode } from './types/scan';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 15 }
  },
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('security');

  const handleScan = async (domain: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, mode: scanMode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scan domain');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* Onboarding Guide for first-time users */}
      <OnboardingGuide />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-br from-zinc-950 via-zinc-900/30 to-zinc-950" />
        
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-[150px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-zinc-700/15 rounded-full blur-[120px]"
          animate={{
            x: [0, -40, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(zinc-700 1px, transparent 1px), linear-gradient(90deg, zinc-700 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center px-4 py-12 sm:py-20">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="landing"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-1 flex-col items-center justify-center w-full max-w-2xl"
            >
              {/* Logo/Icon */}
              <motion.div 
                variants={scaleIn}
                className="text-center mb-12"
                data-guide="logo"
              >
                <motion.div 
                  className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br from-zinc-600 to-zinc-900 shadow-2xl shadow-zinc-900/50 ring-1 ring-zinc-700/50"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  animate={pulseAnimation}
                >
                  <svg
                    className="h-12 w-12 text-zinc-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </motion.div>
                
                <motion.h1 
                  variants={fadeInUp}
                  className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl bg-linear-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent"
                >
                  Security Posture
                </motion.h1>
                <motion.h2 
                  variants={fadeInUp}
                  className="mb-6 text-2xl sm:text-3xl font-medium text-zinc-500"
                >
                  Reconnaissance Analyzer
                </motion.h2>
                
                <motion.p 
                  variants={fadeInUp}
                  className="mx-auto max-w-lg text-lg text-zinc-400 leading-relaxed"
                >
                  Perform passive security reconnaissance on any domain. 
                  Check HTTP headers, SSL certificates, and DNS email security.
                </motion.p>
                
                <motion.div 
                  variants={fadeInUp}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  100% Legal, Non-Intrusive Scanning
                </motion.div>
              </motion.div>

              {/* Scan Mode Selector */}
              <motion.div 
                variants={fadeInUp}
                className="w-full flex justify-center gap-3 mb-6"
                data-guide="scan-modes"
              >
                {[
                  { 
                    id: 'security', 
                    label: 'Scan Security', 
                    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
                    color: 'emerald'
                  },
                  { 
                    id: 'performance', 
                    label: 'Check Performance', 
                    icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
                    color: 'blue'
                  },
                  { 
                    id: 'pentest', 
                    label: 'Pentest', 
                    icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.164 4.177l1.591-1.591M6 10.5H3.75m15.364 7.5l1.591 1.591M12 18V20.25',
                    color: 'purple'
                  },
                ].map((mode) => (
                  <motion.button
                    key={mode.id}
                    onClick={() => setScanMode(mode.id as ScanMode)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 border cursor-pointer ${
                      scanMode === mode.id
                        ? `bg-${mode.color}-500/20 border-${mode.color}-500/50 text-${mode.color}-400 shadow-lg shadow-${mode.color}-500/20`
                        : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mode.icon} />
                    </svg>
                    {mode.label}
                    {scanMode === mode.id && (
                      <motion.div
                        layoutId="activeMode"
                        className={`absolute inset-0 rounded-xl bg-${mode.color}-500/10 border border-${mode.color}-500/30`}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>

              {/* Search Form */}
              <motion.div 
                variants={fadeInUp}
                className="w-full"
                data-guide="search-form"
              >
                <SearchForm onSubmit={handleScan} isLoading={isLoading} />
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mt-6 w-full max-w-md"
                  >
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium text-red-400">Error</span>
                      </div>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Features Grid */}
              <motion.div 
                variants={fadeInUp}
                className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 w-full"
                data-guide="features"
              >
                {[
                  {
                    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                    title: 'HTTP Headers',
                    description: 'HSTS, CSP, X-Frame-Options',
                    color: 'from-blue-500/20 to-blue-600/5',
                    borderColor: 'border-blue-500/20',
                    iconColor: 'text-blue-400',
                  },
                  {
                    icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
                    title: 'SSL/TLS',
                    description: 'Certificate validity & expiry',
                    color: 'from-emerald-500/20 to-emerald-600/5',
                    borderColor: 'border-emerald-500/20',
                    iconColor: 'text-emerald-400',
                  },
                  {
                    icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
                    title: 'DNS Security',
                    description: 'SPF & DMARC records',
                    color: 'from-purple-500/20 to-purple-600/5',
                    borderColor: 'border-purple-500/20',
                    iconColor: 'text-purple-400',
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ 
                      y: -5, 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    className={`group relative overflow-hidden rounded-2xl border ${feature.borderColor} bg-zinc-900/50 p-6 backdrop-blur-sm transition-all`}
                  >
                    <div className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative z-10">
                      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-zinc-200 mb-1">{feature.title}</h3>
                      <p className="text-sm text-zinc-500">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-5xl py-8"
            >
              <ResultsDashboard result={result} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm py-6 mt-auto">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm text-zinc-600"
          >
            This tool performs passive reconnaissance only. No active payloads, SQLi, XSS, or brute-forcing.
          </motion.p>
        </div>
      </footer>
    </div>
  );
}
