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

// SVG flag components for cross-platform support (emoji flags don't work on Windows)
export const localeFlags: Record<Locale, React.ReactNode> = {
  en: (
    <svg viewBox="0 0 640 480" className="w-5 h-5 rounded-sm">
      <path fill="#bd3d44" d="M0 0h640v480H0"/>
      <path stroke="#fff" strokeWidth="37" d="M0 54.5h640M0 129h640M0 203.5h640M0 278h640M0 352.5h640M0 427h640"/>
      <path fill="#192f5d" d="M0 0h364.8v258.5H0"/>
      <marker id="a" markerHeight="30" markerWidth="30">
        <path fill="#fff" d="M14 0l9 27L0 10h28L5 27z"/>
      </marker>
      <path fill="none" marker="url(#a)" d="M0 0L0 0"/>
    </svg>
  ),
  km: (
    <svg viewBox="0 0 640 480" className="w-5 h-5 rounded-sm">
      <path fill="#032ea1" d="M0 0h640v480H0"/>
      <path fill="#e00025" d="M0 160h640v160H0"/>
      <path fill="#032ea1" d="M320 240L0 480V0l320 240z"/>
      <path fill="#fff" d="M125.8 240l71.2-56.6L199.6 240l-2.6 84.4L125.8 240z"/>
    </svg>
  ),
  id: (
    <svg viewBox="0 0 640 480" className="w-5 h-5 rounded-sm">
      <path fill="#e70011" d="M0 0h640v240H0"/>
      <path fill="#fff" d="M0 240h640v240H0"/>
    </svg>
  ),
  ms: (
    <svg viewBox="0 0 640 480" className="w-5 h-5 rounded-sm">
      <path fill="#cc0001" d="M0 0h640v480H0"/>
      <path fill="#fff" d="M0 0h320v240H0"/>
      <path fill="#010066" d="M160 30l17.6 54.2h57L196 117.8l17.6 54.2L160 138.4l-53.6 33.6 17.6-54.2-46.6-33.6h57z"/>
    </svg>
  ),
  ja: (
    <svg viewBox="0 0 640 480" className="w-5 h-5 rounded-sm">
      <path fill="#fff" d="M0 0h640v480H0"/>
      <circle fill="#bc002d" cx="320" cy="240" r="120"/>
    </svg>
  ),
  zh: (
    <svg viewBox="0 0 640 480" className="w-5 h-5 rounded-sm">
      <path fill="#de2910" d="M0 0h640v480H0"/>
      <g fill="#ffde00">
        <path d="M120 40l14.4 44.3h46.6l-37.7 27.4 14.4 44.3L120 128.6 82.3 156l14.4-44.3L59 84.3h46.6z"/>
        <path d="M200 20l4.5 13.8h14.4l-11.7 8.5 4.5 13.8-11.7-8.5-11.7 8.5 4.5-13.8-11.7-8.5h14.4z"/>
        <path d="M240 40l4.5 13.8h14.4l-11.7 8.5 4.5 13.8-11.7-8.5-11.7 8.5 4.5-13.8-11.7-8.5h14.4z"/>
        <path d="M240 80l4.5 13.8h14.4l-11.7 8.5 4.5 13.8-11.7-8.5-11.7 8.5 4.5-13.8-11.7-8.5h14.4z"/>
        <path d="M200 100l4.5 13.8h14.4l-11.7 8.5 4.5 13.8-11.7-8.5-11.7 8.5 4.5-13.8-11.7-8.5h14.4z"/>
      </g>
    </svg>
  ),
};
