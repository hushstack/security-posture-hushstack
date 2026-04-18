'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

interface Feature {
  id: string;
  icon: string;
  accent: string;
}

const features: Feature[] = [
  {
    id: 'security',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    accent: 'var(--accent-primary)',
  },
  {
    id: 'performance',
    icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
    accent: 'var(--accent-success)',
  },
  {
    id: 'pentest',
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
    accent: 'var(--accent-purple)',
  },
];

export function FeaturesGrid() {
  const t = useTranslations('scanModes');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 w-full"
    >
      {features.map((feature, index) => (
        <motion.div
          key={feature.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          whileHover={{
            y: -4,
            scale: 1.01,
            transition: { duration: 0.2 },
          }}
          className="group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all cursor-default"
          style={{
            backgroundColor: 'var(--background-elevated)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: `${feature.accent}08` }}
          />
          <div className="relative z-10">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: `${feature.accent}15`,
                color: feature.accent,
              }}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={feature.icon}
                />
              </svg>
            </div>
            <h3
              className="font-semibold mb-1"
              style={{ color: 'var(--foreground)' }}
            >
              {t(`${feature.id}.title`)}
            </h3>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              {t(`${feature.id}.description`)}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
