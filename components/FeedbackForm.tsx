'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface FeedbackFormProps {
  onClose?: () => void;
}

export function FeedbackForm({ onClose }: FeedbackFormProps) {
  const t = useTranslations('feedback');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage(t('ratingRequired'));
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      rating,
      message: formData.get('message') as string,
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        setStatus('success');
        setTimeout(() => {
          onClose?.();
        }, 3000);
      } else {
        setStatus('error');
        setErrorMessage(result.error || t('error'));
      }
    } catch {
      setStatus('error');
      setErrorMessage(t('error'));
    }
  }

  if (status === 'success') {
    return (
      <div className="relative overflow-hidden rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--background-elevated)' }}>
        {/* Animated gradient border effect */}
        <div
          className="absolute inset-0 rounded-2xl opacity-30"
          style={{
            background: 'linear-gradient(135deg, var(--accent-success) 0%, var(--accent-primary) 100%)',
            filter: 'blur(20px)',
          }}
        />
        <div className="relative">
          {/* Animated checkmark with ring */}
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <div
              className="absolute h-20 w-20 animate-ping rounded-full opacity-20"
              style={{ backgroundColor: 'var(--accent-success)' }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 10px 40px rgba(16, 185, 129, 0.4)',
              }}
            >
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                  className="animate-[draw_0.5s_ease-out_forwards]"
                  style={{
                    strokeDasharray: 24,
                    strokeDashoffset: 0,
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Title with gradient */}
          <h3
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--foreground) 0%, var(--accent-success) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('successTitle')}
          </h3>

          {/* Message */}
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--foreground-subtle)' }}>
            {t('successMessage')}
          </p>

          {/* Decorative dots */}
          <div className="mt-5 flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 animate-bounce rounded-full"
                style={{
                  backgroundColor: 'var(--accent-success)',
                  animationDelay: `${i * 150}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
          {t('name')}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          maxLength={100}
          placeholder="John Doe"
          className="block w-full rounded-xl border-2 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-0"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--background-card)',
            color: 'var(--foreground)',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
          {t('email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="john@example.com"
          className="block w-full rounded-xl border-2 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-0"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--background-card)',
            color: 'var(--foreground)',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
          {t('rating')}
        </label>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="cursor-pointer rounded-lg p-2 transition-all duration-150 hover:scale-125"
              style={{
                color: star <= (hoverRating || rating) ? '#fbbf24' : 'var(--foreground-muted)',
                backgroundColor: star <= (hoverRating || rating) ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
              }}
            >
              <svg className="h-8 w-8 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        <p className="text-center text-xs" style={{ color: 'var(--foreground-muted)' }}>
          {rating > 0 ? `${rating}/5 stars` : 'Click a star to rate'}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
          {t('message')}
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={1000}
          rows={4}
          placeholder="Share your thoughts about our tool..."
          className="block w-full rounded-xl border-2 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-0 resize-none"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--background-card)',
            color: 'var(--foreground)',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--accent-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 hover:bg-gray-100"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--foreground)',
            }}
          >
            {t('cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={status === 'sending'}
          className="cursor-pointer flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-lg"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          {status === 'sending' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('sending')}
            </span>
          ) : (
            t('submit')
          )}
        </button>
      </div>
    </form>
  );
}
