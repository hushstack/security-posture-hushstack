'use client';

import { motion } from 'motion/react';
import { FindingCard } from '@/app/components/FindingCard';
import type { SecurityFinding } from '@/app/types/scan';

interface FindingsSectionProps {
  title: string;
  icon: string;
  iconColor: string;
  findings: SecurityFinding[];
  delay?: number;
}

export function FindingsSection({
  title,
  icon,
  iconColor,
  findings,
  delay = 0,
}: FindingsSectionProps) {
  if (findings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <h3
        className="mb-4 text-xl font-semibold flex items-center gap-2"
        style={{ color: 'var(--foreground)' }}
      >
        <svg
          className="h-5 w-5"
          style={{ color: iconColor }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d={icon}
          />
        </svg>
        {title}
      </h3>
      <div className="space-y-3">
        {findings.map((finding, index) => (
          <motion.div
            key={`${finding.id}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + index * 0.1 }}
          >
            <FindingCard finding={finding} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
