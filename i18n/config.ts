export type Locale = 'en' | 'km' | 'id' | 'ms' | 'ja' | 'zh';

export const locales: Locale[] = ['en', 'km', 'id', 'ms', 'ja', 'zh'];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  km: 'Khmer',
  id: 'Bahasa Indonesia',
  ms: 'Malay',
  ja: 'Japanese',
  zh: 'Chinese',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  km: '🇰🇭',
  id: '🇮🇩',
  ms: '🇲🇾',
  ja: '🇯🇵',
  zh: '🇨🇳',
};
