'use client';

import { memo } from 'react';
import type { SecurityFinding, FindingSeverity } from '@/app/types/scan';
import { motion } from 'motion/react';

interface FindingCardProps {
  finding: SecurityFinding;
}

const severityStyles: Record<FindingSeverity, { icon: string; border: string; bg: string }> = {
  good: {
    icon: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  warning: {
    icon: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
  },
  bad: {
    icon: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
  },
  critical: {
    icon: 'text-red-500',
    border: 'border-red-600/50',
    bg: 'bg-red-600/20',
  },
  info: {
    icon: 'text-zinc-400',
    border: 'border-zinc-600/30',
    bg: 'bg-zinc-600/10',
  },
};

const categoryLabels: Record<string, string> = {
  headers: 'HTTP Headers',
  dns: 'DNS Records',
  ssl: 'SSL/TLS',
  general: 'General',
  performance: 'Performance',
  pentest: 'Pentest',
  vulnerability: 'Vulnerability',
};

function CheckIcon({ severity }: { severity: FindingSeverity }) {
  if (severity === 'good') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (severity === 'warning') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export const FindingCard = memo(function FindingCard({ finding }: FindingCardProps) {
  const styles = severityStyles[finding.severity];

  return (
    <motion.div 
      whileHover={{ scale: 1.01, x: 4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`rounded-xl border p-4 ${styles.border} ${styles.bg} backdrop-blur-sm cursor-default`}
    >
      <div className="flex items-start gap-3">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className={`mt-0.5 shrink-0 ${styles.icon}`}
        >
          <CheckIcon severity={finding.severity} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-zinc-100">{finding.title}</h3>
            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-950/50 text-zinc-400 border border-zinc-800">
              {categoryLabels[finding.category] || finding.category}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{finding.description}</p>
          {finding.details && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 text-xs font-mono text-zinc-500 break-all bg-zinc-950/30 rounded-lg px-3 py-2"
            >
              {finding.details}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
});
