'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { SecurityFinding } from '@/app/types/scan';

interface StatsSummaryProps {
  findings: SecurityFinding[];
}

interface StatCardProps {
  count: number;
  label: string;
  color: string;
  delay: number;
}

function StatCard({ count, label, color, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      className="p-5 text-center rounded-xl border"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--background-elevated)',
      }}
    >
      <p
        className="text-3xl font-semibold"
        style={{ color }}
      >
        {count}
      </p>
      <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
        {label}
      </p>
    </motion.div>
  );
}

export function StatsSummary({ findings }: StatsSummaryProps) {
  const t = useTranslations('results');

  const goodFindings = findings.filter((f) => f.severity === 'good');
  const warningFindings = findings.filter((f) => f.severity === 'warning');
  const badFindings = findings.filter((f) => f.severity === 'bad' || f.severity === 'critical');

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        count={goodFindings.length}
        label={t('passed')}
        color="var(--accent-success)"
        delay={0.1}
      />
      <StatCard
        count={warningFindings.length}
        label={t('warnings')}
        color="var(--accent-warning)"
        delay={0.2}
      />
      <StatCard
        count={badFindings.length}
        label={t('issues')}
        color="var(--accent-danger)"
        delay={0.3}
      />
    </div>
  );
}
