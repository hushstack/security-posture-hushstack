'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { SearchForm } from './components/SearchForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { OnboardingGuide } from './components/OnboardingGuide';
import { LanguageSwitcher } from './components/LanguageSwitcher';
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


export default function Home() {
  const t = useTranslations();
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
      setError(err instanceof Error ? err.message : t('errors.default'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
      {/* Onboarding Guide for first-time users */}
      <OnboardingGuide />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs with new color scheme */}
        <motion.div 
          className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-[var(--accent-primary)]/10 rounded-full blur-[180px]"
          animate={{
            x: [0, 60, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--accent-purple)]/8 rounded-full blur-[140px]"
          animate={{
            x: [0, -50, 0],
            y: [0, -60, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-success)]/5 rounded-full blur-[200px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
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
                className="text-center mb-10"
                data-guide="logo"
              >
                <motion.div 
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--background-elevated)] shadow-2xl shadow-black/40 ring-1 ring-[var(--border-default)]"
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <div className="relative">
                    <svg
                      className="h-10 w-10 text-[var(--accent-primary)]"
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
                    <motion.div
                      className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-xl rounded-full"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>
                
                <motion.h1 
                  variants={fadeInUp}
                  className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                  style={{ fontFamily: 'var(--font-pixel), sans-serif' }}
                >
                  <span className="bg-linear-to-r from-[var(--foreground)] via-[var(--accent-primary)] to-[var(--accent-purple)] bg-clip-text text-transparent">
                    {t('home.title')}
                  </span>
                </motion.h1>
                <motion.h2 
                  variants={fadeInUp}
                  className="mb-6 text-xl sm:text-2xl lg:text-3xl font-medium text-[var(--foreground-muted)]"
                >
                  {t('home.subtitle')}
                </motion.h2>
                
                <motion.p 
                  variants={fadeInUp}
                  className="mx-auto max-w-xl text-base sm:text-lg text-[var(--foreground-subtle)] leading-relaxed"
                >
                  {t('home.description')}
                </motion.p>
                
                <motion.div 
                  variants={fadeInUp}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/20 text-[var(--accent-success)] text-sm font-medium"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-success)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-success)]"></span>
                  </span>
                  {t('home.legalBadge')}
                </motion.div>
              </motion.div>

              {/* Scan Mode Selector */}
              <motion.div 
                variants={fadeInUp}
                className="w-full flex justify-center gap-2 sm:gap-3 mb-6 flex-wrap"
                data-guide="scan-modes"
              >
                {[
                  { 
                    id: 'security', 
                    label: t('scanModes.security.label'), 
                    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
                    accent: 'var(--accent-success)'
                  },
                  { 
                    id: 'performance', 
                    label: t('scanModes.performance.label'), 
                    icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
                    accent: 'var(--accent-primary)'
                  },
                  { 
                    id: 'pentest', 
                    label: t('scanModes.pentest.label'), 
                    icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.164 4.177l1.591-1.591M6 10.5H3.75m15.364 7.5l1.591 1.591M12 18V20.25',
                    accent: 'var(--accent-purple)'
                  },
                ].map((mode) => (
                  <motion.button
                    key={mode.id}
                    onClick={() => setScanMode(mode.id as ScanMode)}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative px-4 sm:px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 border cursor-pointer"
                    style={{
                      backgroundColor: scanMode === mode.id ? `${mode.accent}15` : 'var(--background-elevated)',
                      borderColor: scanMode === mode.id ? mode.accent : 'var(--border-default)',
                      color: scanMode === mode.id ? mode.accent : 'var(--foreground-muted)',
                      boxShadow: scanMode === mode.id ? `0 0 20px ${mode.accent}20` : 'none'
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mode.icon} />
                    </svg>
                    <span className="hidden sm:inline">{mode.label}</span>
                    <span className="sm:hidden">{mode.id === 'security' ? 'Security' : mode.id === 'performance' ? 'Perf' : 'Pentest'}</span>
                    {scanMode === mode.id && (
                      <motion.div
                        layoutId="activeMode"
                        className="absolute inset-0 rounded-xl"
                        style={{ 
                          backgroundColor: `${mode.accent}08`,
                          border: `1px solid ${mode.accent}40`
                        }}
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
                    <div 
                      className="rounded-xl border px-6 py-4 text-center backdrop-blur-sm"
                      style={{ 
                        borderColor: 'var(--accent-danger)40', 
                        backgroundColor: 'var(--accent-danger)10' 
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <svg className="h-5 w-5" style={{ color: 'var(--accent-danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium" style={{ color: 'var(--accent-danger)' }}>{t('errors.title')}</span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--accent-danger)', opacity: 0.9 }}>{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Features Grid */}
              <motion.div 
                variants={fadeInUp}
                className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 w-full"
                data-guide="features"
              >
                {[
                  {
                    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                    title: t('scanModes.security.title'),
                    description: t('scanModes.security.description'),
                    accent: 'var(--accent-primary)',
                  },
                  {
                    icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
                    title: t('scanModes.performance.title'),
                    description: t('scanModes.performance.description'),
                    accent: 'var(--accent-success)',
                  },
                  {
                    icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
                    title: t('scanModes.pentest.title'),
                    description: t('scanModes.pentest.description'),
                    accent: 'var(--accent-purple)',
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ 
                      y: -4, 
                      scale: 1.01,
                      transition: { duration: 0.2 }
                    }}
                    className="group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all cursor-default"
                    style={{
                      backgroundColor: 'var(--background-elevated)',
                      borderColor: 'var(--border-default)'
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ backgroundColor: `${feature.accent}08` }}
                    />
                    <div className="relative z-10">
                      <div 
                        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                        style={{ 
                          backgroundColor: `${feature.accent}15`,
                          color: feature.accent
                        }}
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                        </svg>
                      </div>
                      <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{feature.title}</h3>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{feature.description}</p>
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
      <footer 
        className="relative z-10 border-t py-6 mt-auto"
        style={{ 
          borderColor: 'var(--border-muted)', 
          backgroundColor: 'var(--background)' 
        }}
      >
        <div className="mx-auto max-w-6xl px-4 text-center">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            {t('footer.disclaimer')}
          </motion.p>
        </div>
      </footer>
    </div>
  );
}
