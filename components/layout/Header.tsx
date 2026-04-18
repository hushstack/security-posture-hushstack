'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';

export function Header() {
  const t = useTranslations('home');

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderColor: 'var(--border-muted)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--accent-primary)/10' }}
            >
              <svg
                className="h-5 w-5"
                style={{ color: 'var(--accent-primary)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {t('title')}
              </h1>
              <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <span
              className="hidden md:inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: 'var(--accent-success)/10',
                color: 'var(--accent-success)',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
              </span>
              {t('legalBadge')}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
