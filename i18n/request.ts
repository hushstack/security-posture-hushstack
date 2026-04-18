import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { Locale, defaultLocale, locales } from './config';

async function getLocaleFromHeaders(): Promise<Locale> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  
  if (!acceptLanguage) return defaultLocale;
  
  // Parse accept-language header
  const preferredLocales = acceptLanguage
    .split(',')
    .map((lang: string) => lang.split(';')[0].trim().toLowerCase());
  
  // Find matching locale
  for (const preferred of preferredLocales) {
    const shortCode = preferred.split('-')[0] as Locale;
    if (locales.includes(shortCode)) {
      return shortCode;
    }
  }
  
  return defaultLocale;
}

export default getRequestConfig(async () => {
  // Check cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined;
  
  // Use cookie locale if valid, otherwise detect from headers
  let locale: Locale = defaultLocale;
  if (localeCookie && locales.includes(localeCookie)) {
    locale = localeCookie;
  } else {
    locale = await getLocaleFromHeaders();
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
