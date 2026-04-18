'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';

interface ErrorMessageProps {
  error: string | null;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  const t = useTranslations('errors');

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="mt-6 w-full max-w-md mx-auto"
          role="alert"
          aria-live="assertive"
        >
          <div
            className="rounded-xl border px-6 py-4 text-center backdrop-blur-sm"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.25)',
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg
                className="h-5 w-5"
                style={{ color: 'var(--accent-danger)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span
                className="font-medium"
                style={{ color: 'var(--accent-danger)' }}
              >
                {t('title')}
              </span>
            </div>
            <p
              className="text-sm"
              style={{ color: 'var(--accent-danger)', opacity: 0.9 }}
            >
              {error}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
