'use client';

import { memo } from 'react';
import type { SecurityGrade, PerformanceGrade, PentestGrade } from '@/app/types/scan';
import { motion } from 'motion/react';

interface GradeBadgeProps {
  grade: SecurityGrade | PerformanceGrade | PentestGrade;
  score: number;
}

const gradeStyles: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'var(--accent-success)20', text: 'var(--accent-success)', border: 'var(--accent-success)40' },
  B: { bg: 'var(--accent-primary)20', text: 'var(--accent-primary)', border: 'var(--accent-primary)40' },
  C: { bg: 'var(--accent-warning)20', text: 'var(--accent-warning)', border: 'var(--accent-warning)40' },
  D: { bg: 'var(--accent-warning)30', text: 'var(--accent-warning)', border: 'var(--accent-warning)50' },
  F: { bg: 'var(--accent-danger)20', text: 'var(--accent-danger)', border: 'var(--accent-danger)40' },
  SECURE: { bg: 'var(--accent-success)20', text: 'var(--accent-success)', border: 'var(--accent-success)40' },
  VULNERABLE: { bg: 'var(--accent-warning)20', text: 'var(--accent-warning)', border: 'var(--accent-warning)40' },
  CRITICAL: { bg: 'var(--accent-danger)20', text: 'var(--accent-danger)', border: 'var(--accent-danger)40' },
};

const gradeDescriptions: Record<string, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Fair',
  D: 'Poor',
  F: 'Critical',
  SECURE: 'No Critical Issues',
  VULNERABLE: 'Vulnerabilities Found',
  CRITICAL: 'Critical Issues',
};

export const GradeBadge = memo(function GradeBadge({ grade, score }: GradeBadgeProps) {
  const styles = gradeStyles[grade];
  
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-2xl border-2 text-5xl sm:text-6xl font-bold backdrop-blur-sm shadow-2xl"
        style={{
          backgroundColor: styles?.bg || 'var(--background-elevated)',
          color: styles?.text || 'var(--foreground)',
          borderColor: styles?.border || 'var(--border-default)',
          boxShadow: `0 8px 32px ${styles?.bg || 'transparent'}`
        }}
      >
        {grade}
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center"
      >
        <motion.p 
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          className="text-2xl font-semibold"
          style={{ color: 'var(--foreground)' }}
        >
          {score}/100
        </motion.p>
        <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
          {gradeDescriptions[grade]}
        </p>
      </motion.div>
    </div>
  );
});
