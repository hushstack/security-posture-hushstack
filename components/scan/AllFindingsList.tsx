'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { SecurityFinding } from '@/app/types/scan';

interface AllFindingsListProps {
  findings: SecurityFinding[];
}

const severityIcons: Record<string, string> = {
  good: '✓',
  warning: '⚠',
  bad: '✗',
  critical: '!',
  info: '•',
};

const severityColors: Record<string, { border: string; bg: string; text: string }> = {
  good: {
    border: 'var(--accent-success)30',
    bg: 'var(--accent-success)10',
    text: 'var(--accent-success)',
  },
  warning: {
    border: 'var(--accent-warning)30',
    bg: 'var(--accent-warning)10',
    text: 'var(--accent-warning)',
  },
  bad: {
    border: 'var(--accent-danger)30',
    bg: 'var(--accent-danger)10',
    text: 'var(--accent-danger)',
  },
  critical: {
    border: 'var(--accent-danger)50',
    bg: 'var(--accent-danger)20',
    text: 'var(--accent-danger)',
  },
  info: {
    border: 'var(--border-default)',
    bg: 'var(--background-card)',
    text: 'var(--foreground-muted)',
  },
};

export function AllFindingsList({ findings }: AllFindingsListProps) {
  const t = useTranslations('results');

  if (findings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-6"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--background-elevated)',
      }}
    >
      <h3
        className="mb-4 text-xl font-semibold flex items-center gap-2"
        style={{ color: 'var(--foreground)' }}
      >
        <svg
          className="h-5 w-5"
          style={{ color: 'var(--foreground-muted)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        {t('allFindings')} ({findings.length})
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {findings.map((finding, index) => {
          const colors = severityColors[finding.severity] || severityColors.info;
          return (
            <motion.div
              key={`${finding.id}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 rounded-lg border text-sm"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.bg,
              }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="font-medium"
                  style={{ color: colors.text }}
                >
                  {severityIcons[finding.severity] || '•'}
                </span>
                <div className="flex-1">
                  <p
                    className="font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {finding.title}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {finding.description}
                  </p>
                  {finding.details && (
                    <p
                      className="text-xs mt-1 font-mono"
                      style={{ color: 'var(--foreground-subtle)' }}
                    >
                      {finding.details}
                    </p>
                  )}
                  {finding.recommendation && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--accent-success)' }}
                    >
                      {t('fix')}: {finding.recommendation}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs uppercase"
                  style={{ color: 'var(--foreground-subtle)' }}
                >
                  {t(`categories.${finding.category}`)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
