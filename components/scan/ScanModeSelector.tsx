'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ScanMode } from '@/app/types/scan';

interface ScanModeOption {
  id: ScanMode;
  icon: string;
  accent: string;
}

const scanModes: ScanModeOption[] = [
  {
    id: 'security',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    accent: 'var(--accent-success)',
  },
  {
    id: 'performance',
    icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
    accent: 'var(--accent-primary)',
  },
  {
    id: 'pentest',
    icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.164 4.177l1.591-1.591M6 10.5H3.75m15.364 7.5l1.591 1.591M12 18V20.25',
    accent: 'var(--accent-purple)',
  },
  {
    id: 'audit',
    icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z',
    accent: 'var(--accent-danger)',
  },
];

interface ScanModeSelectorProps {
  value: ScanMode;
  onChange: (mode: ScanMode) => void;
}

export function ScanModeSelector({ value, onChange }: ScanModeSelectorProps) {
  const t = useTranslations('scanModes');

  return (
    <div
      className="flex flex-wrap justify-center gap-2 sm:gap-3"
      role="radiogroup"
      aria-label="Scan mode selection"
    >
      {scanModes.map((mode) => {
        const isSelected = value === mode.id;
        const label = t(`${mode.id}.label`);
        const shortLabel = mode.id === 'security' ? 'Security' : mode.id === 'performance' ? 'Perf' : mode.id === 'pentest' ? 'Pentest' : 'Audit';

        return (
          <motion.button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={`
              relative px-4 sm:px-5 py-3 rounded-lg font-medium text-sm 
              transition-all flex items-center gap-2 border cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
            `}
            style={{
              backgroundColor: isSelected ? 'var(--background-card)' : 'transparent',
              borderColor: isSelected ? mode.accent : 'var(--border-default)',
              color: isSelected ? mode.accent : 'var(--foreground-muted)',
              boxShadow: isSelected ? `0 0 0 1px ${mode.accent}` : 'none',
            }}
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d={mode.icon}
              />
            </svg>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
            {isSelected && (
              <motion.div
                layoutId="scanModeIndicator"
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 1px ${mode.accent}`,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
