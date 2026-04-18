'use client';

import { memo } from 'react';
import type { SecurityFinding, FindingSeverity } from '@/app/types/scan';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

interface FindingCardProps {
  finding: SecurityFinding;
}

const severityStyles: Record<FindingSeverity, { icon: string; border: string; bg: string }> = {
  good: {
    icon: 'var(--accent-success)',
    border: 'var(--accent-success)30',
    bg: 'var(--accent-success)10',
  },
  warning: {
    icon: 'var(--accent-warning)',
    border: 'var(--accent-warning)30',
    bg: 'var(--accent-warning)10',
  },
  bad: {
    icon: 'var(--accent-danger)',
    border: 'var(--accent-danger)30',
    bg: 'var(--accent-danger)10',
  },
  critical: {
    icon: 'var(--accent-danger)',
    border: 'var(--accent-danger)50',
    bg: 'var(--accent-danger)20',
  },
  info: {
    icon: 'var(--foreground-muted)',
    border: 'var(--border-default)',
    bg: 'var(--background-card)',
  },
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
  const t = useTranslations('results');
  const styles = severityStyles[finding.severity];

  return (
    <motion.div 
      whileHover={{ scale: 1.01, x: 4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-xl border p-4 backdrop-blur-sm cursor-default"
      style={{ borderColor: styles.border, backgroundColor: styles.bg }}
    >
      <div className="flex items-start gap-3">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="mt-0.5 shrink-0"
          style={{ color: styles.icon }}
        >
          <CheckIcon severity={finding.severity} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>{finding.title}</h3>
            <span 
              className="rounded-full px-2 py-0.5 text-xs font-medium border"
              style={{ 
                backgroundColor: 'var(--background)', 
                color: 'var(--foreground-muted)',
                borderColor: 'var(--border-default)'
              }}
            >
              {t(`categories.${finding.category}`) || finding.category}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{finding.description}</p>
          {finding.details && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 text-xs font-mono break-all rounded-lg px-3 py-2"
              style={{ color: 'var(--foreground-subtle)', backgroundColor: 'var(--background)' }}
            >
              {finding.details}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
});
