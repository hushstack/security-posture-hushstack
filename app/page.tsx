'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { HeroSection, FeaturesGrid } from '@/components/scan';
import { SearchForm } from './components/SearchForm';
import { OnboardingGuide } from './components/OnboardingGuide';

export default function Home() {
  const router = useRouter();

  const handleScan = async (domain: string) => {
    // Navigate to loading page which will handle the scan
    router.push(`/scan/loading?domain=${encodeURIComponent(domain)}`);
  };

  return (
    <MainLayout>
      <div className="relative min-h-[calc(100vh-4rem)] overflow-x-hidden">
        <OnboardingGuide />

        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.15), transparent)`,
            }}
          />
        </div>

        <main className="relative z-10 flex flex-col items-center px-4 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center w-full max-w-2xl"
          >
            <div data-guide="logo">
              <HeroSection />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full"
              data-guide="search-form"
            >
              <SearchForm onSubmit={handleScan} isLoading={false} />
            </motion.div>


            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              data-guide="features"
            >
              <FeaturesGrid />
            </motion.div>
          </motion.div>
        </main>
      </div>
    </MainLayout>
  );
}
