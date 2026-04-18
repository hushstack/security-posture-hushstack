import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  fullHeight?: boolean;
}

export function MainLayout({
  children,
  showHeader = true,
  showFooter = true,
  fullHeight = true,
}: MainLayoutProps) {
  return (
    <div
      className={`flex flex-col ${fullHeight ? 'min-h-screen' : ''}`}
      style={{ backgroundColor: 'var(--background)' }}
    >
      {showHeader && <Header />}
      <main className={`flex-1 ${showHeader ? 'pt-16' : ''}`}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
