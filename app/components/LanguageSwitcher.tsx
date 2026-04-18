'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Locale, locales, localeNames } from '@/i18n/config';
import { FlagIcons } from '@/components/FlagIcons';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('language');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      // Set cookie and refresh - this preserves page state
      document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
      router.refresh();
      setIsOpen(false);
    });
  };

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700/50 bg-zinc-900/50 text-zinc-400 text-sm min-w-[120px]">
        <span>🌐</span>
        <span>Language</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer min-w-[140px] ${
          isOpen
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
            : 'border-zinc-700/50 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
        }`}
        disabled={isPending}
      >
        <span className="text-lg">{FlagIcons[locale as Locale]}</span>
        <span className="text-sm font-medium">{localeNames[locale as Locale]}</span>
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <path d="m6 9 6 6 6-6" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 min-w-[200px]"
            >
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                    {t('title')}
                  </p>
                </div>
                <div className="p-1">
                  {locales.map((l) => (
                    <motion.button
                      key={l}
                      onClick={() => handleLocaleChange(l)}
                      whileHover={{ x: 2 }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                        l === locale
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-lg">{FlagIcons[l]}</span>
                      <span className="flex-1 text-left">{t(l)}</span>
                      {l === locale && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </motion.svg>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
