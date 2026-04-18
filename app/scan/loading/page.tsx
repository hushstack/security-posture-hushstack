'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useSearchParams, useRouter } from 'next/navigation';

interface ScanPhase {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const scanPhases: ScanPhase[] = [
  { id: 'security', label: 'Security Analysis', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: '#22c55e' },
  { id: 'performance', label: 'Performance Check', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', color: '#3b82f6' },
  { id: 'pentest', label: 'Pentest Scan', icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672z', color: '#a855f7' },
  { id: 'audit', label: 'Deep Audit', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z', color: '#ef4444' },
];

const techTerms = [
  'Initializing handshake...', 'Probing SSL/TLS...', 'Analyzing headers...', 'Checking DNS records...',
  'Scanning ports...', 'Detecting technologies...', 'Testing XSS vectors...', 'Searching for leaks...',
  'Calculating risk score...', 'Generating report...',
];

export default function ScanLoadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain') || '';
  
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>(['Initializing scan sequence...']);

  const addLog = useCallback((message: string) => {
    setTerminalLogs(prev => [...prev.slice(-5), `> ${message}`]);
  }, []);

  useEffect(() => {
    if (!domain) { router.push('/'); return; }

    let phaseIndex = 0, totalProgress = 0, termIndex = 0;

    // Cycle through all 4 phases evenly (0-75% for 4 phases, then 75-95% waiting)
    const interval = setInterval(() => {
      totalProgress += 0.4; // Slower progress to show all phases
      
      // Ensure we hit all 4 phases: 0-20%, 20-40%, 40-60%, 60-80%
      const phaseProgress = Math.min(totalProgress, 80);
      const newPhase = Math.min(Math.floor((phaseProgress / 80) * 4), 3);
      
      if (newPhase !== phaseIndex) {
        phaseIndex = newPhase;
        setCurrentPhase(phaseIndex);
        addLog(`Starting ${scanPhases[phaseIndex]?.label}...`);
      }
      
      // Cap at 95% until scan completes
      setProgress(Math.min(totalProgress, 95));

      if (Math.random() > 0.7 && termIndex < techTerms.length) {
        addLog(techTerms[termIndex]);
        termIndex = (termIndex + 1) % techTerms.length;
      }
    }, 100);

    const runScan = async () => {
      try {
        addLog('Connecting to target...');
        const response = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain }) });
        if (!response.ok) throw new Error('Scan failed');
        const data = await response.json();
        addLog('Scan complete! Finalizing...');
        
        // Animate to 100% slowly
        let finalProgress = 95;
        const completeInterval = setInterval(() => {
          finalProgress += 1;
          setProgress(finalProgress);
          if (finalProgress >= 100) {
            clearInterval(completeInterval);
            addLog('Redirecting to results...');
            setTimeout(() => {
              sessionStorage.setItem('scanResult', JSON.stringify(data));
              sessionStorage.setItem('scanDomain', domain);
              router.push(`/results?domain=${encodeURIComponent(domain)}`);
            }, 800);
          }
        }, 150);
      } catch {
        router.push(`/?error=${encodeURIComponent('Scan failed')}`);
      }
    };

    runScan();
    return () => clearInterval(interval);
  }, [domain, router, addLog]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15), transparent 50%)`,
          }}
        />
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 w-full max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Clean card */}
        <div 
          className="rounded-2xl p-8 border"
          style={{ 
            backgroundColor: 'var(--background-elevated)',
            borderColor: 'var(--border-default)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </motion.div>
            
            <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--foreground-default)' }}>
              Scanning <span style={{ color: 'var(--accent-primary)' }}>{domain}</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              {scanPhases[currentPhase]?.label || 'Initializing...'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--foreground-muted)' }}>
              <span>{Math.round(progress)}%</span>
              <span>~15-30 seconds</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--background-default)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--accent-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Phase indicators */}
          <div className="flex gap-2 mb-6">
            {scanPhases.map((phase, index) => {
              const isActive = index === currentPhase;
              const isCompleted = index < currentPhase;
              
              return (
                <div
                  key={phase.id}
                  className="flex-1 py-3 px-2 rounded-lg text-center transition-all"
                  style={{
                    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : isCompleted ? 'rgba(34, 197, 94, 0.05)' : 'var(--background-default)',
                    border: `1px solid ${isActive ? 'var(--accent-primary)' : isCompleted ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-default)'}`,
                  }}
                >
                  <div className="flex justify-center mb-1">
                    {isCompleted ? (
                      <svg className="w-4 h-4" style={{ color: 'var(--accent-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--foreground-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={phase.icon} />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs font-medium" style={{ color: isActive ? 'var(--accent-primary)' : isCompleted ? 'var(--foreground-default)' : 'var(--foreground-muted)' }}>
                    {phase.label}
                  </p>
                  {isActive && (
                    <motion.div
                      className="mt-2 h-0.5 rounded-full mx-auto"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, ease: 'linear' }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Terminal logs */}
          <div 
            className="rounded-lg p-3 font-mono text-xs"
            style={{ 
              backgroundColor: 'var(--background-default)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="ml-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>scan.log</span>
            </div>
            <div className="space-y-1 h-16 overflow-hidden">
              {terminalLogs.map((log, i) => (
                <div key={i} className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                  <span style={{ color: 'var(--foreground-muted)' }}>[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
