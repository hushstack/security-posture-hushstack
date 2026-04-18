'use client';

import type { Locale } from '@/i18n/config';
import { US, KH, ID, MY, JP, CN } from 'country-flag-icons/react/3x2';

// Map locale codes to country-flag-icons components
export const FlagIcons: Record<Locale, React.ReactNode> = {
  en: <US className="w-5 h-5 rounded-sm" />,
  km: <KH className="w-5 h-5 rounded-sm" />,
  id: <ID className="w-5 h-5 rounded-sm" />,
  ms: <MY className="w-5 h-5 rounded-sm" />,
  ja: <JP className="w-5 h-5 rounded-sm" />,
  zh: <CN className="w-5 h-5 rounded-sm" />,
};
