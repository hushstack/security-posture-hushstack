'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { GradeBadge } from '@/app/components/GradeBadge';
import type { ScanResult } from '@/app/types/scan';

interface ResultsHeaderProps {
  result: ScanResult;
}

export function ResultsHeader({ result }: ResultsHeaderProps) {
  const t = useTranslations('results');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left p-6 rounded-xl border"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--background-elevated)',
      }}
    >
      <div className="flex-1">
        <h2
          className="text-2xl font-semibold break-all"
          style={{ color: 'var(--foreground)' }}
        >
          {result.domain}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
          {t('scannedIn')} {result.duration}{t('ms')} • {new Date(result.scanTime).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col items-center">
        <GradeBadge grade={result.grade} score={result.score} />
      </div>
    </motion.div>
  );
}
