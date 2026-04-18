'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FeedbackForm } from '../FeedbackForm';

export function Footer() {
  const t = useTranslations('footer');
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      {/* Floating Feedback Button - Always Visible */}
      <button
        onClick={() => setShowFeedback(true)}
        className="fixed bottom-6 right-6 z-40 cursor-pointer flex items-center gap-2 rounded-full border-2 border-white/20 px-5 py-3 text-sm font-semibold shadow-xl transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:brightness-110 active:scale-95"
        style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
        }}
        title={t('feedbackButton')}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="hidden sm:inline">{t('feedbackButton')}</span>
      </button>

      <footer
        className="border-t py-6"
        style={{
          borderColor: 'var(--border-muted)',
          backgroundColor: 'var(--background)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <p
              className="text-center text-sm"
              style={{ color: 'var(--foreground-subtle)' }}
            >
              {t('disclaimer')}
            </p>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div
            className="w-full max-w-md rounded-lg border p-6 shadow-xl"
            style={{
              borderColor: 'var(--border-muted)',
              backgroundColor: 'var(--background)',
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {t('feedbackTitle')}
              </h3>
              <button
                onClick={() => setShowFeedback(false)}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
                style={{ color: 'var(--foreground-subtle)' }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FeedbackForm onClose={() => setShowFeedback(false)} />
          </div>
        </div>
      )}
    </>
  );
}
