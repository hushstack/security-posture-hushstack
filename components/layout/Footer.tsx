'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer
      className="border-t py-6"
      style={{
        borderColor: 'var(--border-muted)',
        backgroundColor: 'var(--background)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p
          className="text-center text-sm"
          style={{ color: 'var(--foreground-subtle)' }}
        >
          {t('disclaimer')}
        </p>
      </div>
    </footer>
  );
}
