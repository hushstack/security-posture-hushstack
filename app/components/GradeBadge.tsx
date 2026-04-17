'use client';

import type { SecurityGrade, PerformanceGrade, PentestGrade } from '@/app/types/scan';
import { motion } from 'motion/react';

interface GradeBadgeProps {
  grade: SecurityGrade | PerformanceGrade | PentestGrade;
  score: number;
}

const gradeStyles: Record<string, string> = {
  // Security & Performance grades
  A: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  B: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  C: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  D: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  F: 'bg-red-500/20 text-red-400 border-red-500/30',
  // Pentest grades
  SECURE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  VULNERABLE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const gradeDescriptions: Record<string, string> = {
  A: 'Excellent Security',
  B: 'Good Security',
  C: 'Fair Security',
  D: 'Poor Security',
  F: 'Critical Issues',
  SECURE: 'No Critical Vulnerabilities',
  VULNERABLE: 'Vulnerabilities Found',
  CRITICAL: 'Critical Security Issues',
};

export function GradeBadge({ grade, score }: GradeBadgeProps) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        className={`flex h-32 w-32 items-center justify-center rounded-2xl border-2 text-6xl font-bold ${gradeStyles[grade]} backdrop-blur-sm shadow-2xl`}
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
          className="text-2xl font-semibold text-zinc-100"
        >
          {score}/100
        </motion.p>
        <p className="text-sm text-zinc-500 mt-1">{gradeDescriptions[grade]}</p>
      </motion.div>
    </div>
  );
}
