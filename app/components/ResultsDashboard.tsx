'use client';

import type { ScanResult, SecurityFinding } from '@/app/types/scan';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  ResultsHeader,
  StatsSummary,
  FindingsSection,
  AllFindingsList,
} from '@/components/scan';
import { PDFExportButton } from './PDFExportButton';

interface ResultsDashboardProps {
  result: ScanResult;
  onReset: () => void;
}

function groupFindingsByCategory(findings: SecurityFinding[]) {
  const groups: Record<string, SecurityFinding[]> = {
    headers: [],
    dns: [],
    ssl: [],
    general: [],
    performance: [],
    pentest: [],
    vulnerability: [],
  };
  
  for (const finding of findings) {
    const category = finding.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(finding);
  }
  
  return groups;
}

// Section configurations for cleaner rendering
const sections = [
  {
    key: 'ssl',
    icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
    color: 'var(--accent-success)',
    translationKey: 'sections.ssl',
  },
  {
    key: 'headers',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'var(--accent-primary)',
    translationKey: 'sections.headers',
  },
  {
    key: 'dns',
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
    color: 'var(--accent-purple)',
    translationKey: 'sections.dns',
  },
  {
    key: 'general',
    icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zM8.25 9.75h.008v.008H8.25V9.75zm0 3h.008v.008H8.25V12.75z',
    color: 'var(--foreground-muted)',
    translationKey: 'sections.general',
  },
  {
    key: 'performance',
    icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
    color: 'var(--accent-primary)',
    translationKey: 'sections.performance',
  },
  {
    key: 'pentest',
    icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.164 4.177l1.591-1.591M6 10.5H3.75m15.364 7.5l1.591 1.591M12 18V20.25',
    color: 'var(--accent-purple)',
    translationKey: 'sections.pentest',
  },
  {
    key: 'vulnerability',
    icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    color: 'var(--accent-danger)',
    translationKey: 'sections.vulnerability',
  },
];

export function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const t = useTranslations('results');
  const groupedFindings = groupFindingsByCategory(result.findings);

  return (
    <motion.div
      className="w-full max-w-5xl space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.05 }}
    >
      {/* Sticky Top Bar with Action Buttons */}
      <div className="sticky top-0 z-50 -mx-4 px-4 py-3 backdrop-blur-md" style={{ backgroundColor: 'rgba(var(--background-rgb), 0.8)' }}>
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold" style={{ color: 'var(--foreground-default)' }}>{result.domain}</span>
            <span className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}>Grade {result.grade}</span>
          </div>
          <div className="flex items-center gap-3">
            <PDFExportButton result={result} />
            <motion.button
              onClick={onReset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-all cursor-pointer"
              style={{
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--background-elevated)',
                color: 'var(--foreground-muted)'
              }}
            >
              ← New Scan
            </motion.button>
          </div>
        </div>
      </div>

      {/* Header */}
      <ResultsHeader result={result} />

      {/* Summary Stats */}
      <StatsSummary findings={result.findings} />

      {/* Findings by Category */}
      <div className="space-y-6">
        {sections.map((section, index) => (
          <FindingsSection
            key={section.key}
            title={t(section.translationKey)}
            icon={section.icon}
            iconColor={section.color}
            findings={groupedFindings[section.key] || []}
            delay={index * 0.1}
          />
        ))}

        {/* All Findings Summary */}
        <AllFindingsList findings={result.findings} />
      </div>

      {/* Raw Data Toggle */}
      <details
        className="rounded-xl border overflow-hidden group"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--background-elevated)' }}
      >
        <summary className="cursor-pointer p-4 text-sm font-medium transition-colors flex items-center justify-between" style={{ color: 'var(--foreground-muted)' }}>
          <span>{t('viewRaw')}</span>
          <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="border-t p-4" style={{ borderColor: 'var(--border-default)' }}>
          <pre className="overflow-x-auto text-xs font-mono" style={{ color: 'var(--foreground-subtle)' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </details>

      {/* Reset Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center"
      >
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl border px-8 py-4 text-sm font-medium transition-all backdrop-blur-sm cursor-pointer"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--background-elevated)',
            color: 'var(--foreground-muted)'
          }}
        >
          {t('scanAnother')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
