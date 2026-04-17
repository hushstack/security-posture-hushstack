'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const domain = validateDomain(inputValue);
    
    if (!domain) {
      setError('Please enter a valid domain (e.g., example.com)');
      return;
    }

    onSubmit(domain);
  }, [inputValue, onSubmit]);

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="relative group">
        {/* Glow effect */}
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-linear-to-r from-zinc-600 to-zinc-500 opacity-0 blur-md transition-opacity duration-300"
          animate={{ opacity: isFocused ? 0.3 : 0 }}
        />
        
        <div className="relative flex items-center">
          <div className="absolute left-5 text-zinc-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            placeholder="Enter a domain (e.g., google.com)"
            disabled={isLoading}
            className="w-full rounded-2xl border border-zinc-700/50 bg-zinc-900/80 pl-14 pr-40 py-5 text-lg text-zinc-100 placeholder-zinc-500 backdrop-blur-xl transition-all focus:border-zinc-500 focus:outline-none focus:ring-0 disabled:opacity-50 shadow-xl shadow-black/20"
          />
          
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 rounded-xl bg-zinc-100 px-8 py-3.5 font-semibold text-zinc-900 transition-all hover:bg-white hover:shadow-lg hover:shadow-zinc-100/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
                Scanning
              </span>
            ) : (
              'Scan'
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
            className="mt-3 text-sm text-red-400 flex items-center gap-2"
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
