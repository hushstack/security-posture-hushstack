'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 15 },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function HeroSection() {
  const t = useTranslations('home');

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="text-center mb-10"
    >
      {/* Logo */}
      <motion.div variants={scaleIn} className="mb-6">
        <motion.div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl shadow-2xl ring-1"
          style={{
            backgroundColor: 'var(--background-elevated)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            borderColor: 'var(--border-default)',
          }}
          whileHover={{ scale: 1.05, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <div className="relative">
            <svg
              className="h-10 w-10"
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
            <motion.div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.2 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={fadeInUp}
        className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
      >
        <span
          className="bg-linear-to-r bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(to right, var(--foreground), var(--accent-primary), var(--accent-purple))`,
          }}
        >
          {t('title')}
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.h2
        variants={fadeInUp}
        className="mb-4 text-xl sm:text-2xl lg:text-3xl font-medium"
        style={{ color: 'var(--foreground-muted)' }}
      >
        {t('subtitle')}
      </motion.h2>

      {/* Description */}
      <motion.p
        variants={fadeInUp}
        className="mx-auto max-w-xl text-base sm:text-lg leading-relaxed"
        style={{ color: 'var(--foreground-subtle)' }}
      >
        {t('description')}
      </motion.p>
    </motion.div>
  );
}
