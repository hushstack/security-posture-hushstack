'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';

interface SearchFormProps {
  onSubmit: (domain: string) => void;
  isLoading: boolean;
}

function validateDomain(domain: string): string | null {
  let cleanDomain = domain.trim().toLowerCase();
  
  cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
  cleanDomain = cleanDomain.replace(/^\//, '');
  cleanDomain = cleanDomain.split('/')[0];
  cleanDomain = cleanDomain.split('?')[0];
  cleanDomain = cleanDomain.split('#')[0];
  cleanDomain = cleanDomain.split(':')[0];
  
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;
  
  if (!cleanDomain || cleanDomain.length < 1 || cleanDomain.length > 253) {
    return null;
  }
  
  if (!domainRegex.test(cleanDomain)) {
    return null;
  }
  
  return cleanDomain;
}

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const t = useTranslations('searchForm');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const domain = validateDomain(inputValue);
    
    if (!domain) {
      setError(t('placeholder'));
      return;
    }

    onSubmit(domain);
  }, [inputValue, onSubmit, t]);

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-5" style={{ color: isFocused ? 'var(--accent-primary)' : 'var(--foreground-subtle)' }}>
            <svg className="h-5 w-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('placeholder')}
            disabled={isLoading}
            className="w-full rounded-xl border pl-14 pr-36 sm:pr-40 py-4 text-base transition-all focus:outline-none disabled:opacity-50"
            style={{
              backgroundColor: 'var(--background-elevated)',
              borderColor: isFocused ? 'var(--accent-primary)' : 'var(--border-default)',
              color: 'var(--foreground)',
              boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'
            }}
          />
          
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="absolute right-2 rounded-lg px-6 sm:px-8 py-3 font-medium text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="hidden sm:inline">{t('scanning')}</span>
                <span className="sm:hidden">...</span>
              </span>
            ) : (
              t('scanButton')
            )}
          </motion.button>
        </div>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 text-sm flex items-center gap-2"
            style={{ color: 'var(--accent-danger)' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
