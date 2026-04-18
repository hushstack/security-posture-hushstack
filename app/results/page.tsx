'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { ResultsDashboard } from '@/app/components/ResultsDashboard';
import type { ComprehensiveScanResult } from '@/app/types/scan';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain') || '';
  
  const [result, setResult] = useState<ComprehensiveScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get result from sessionStorage
    const storedResult = sessionStorage.getItem('scanResult');
    const storedDomain = sessionStorage.getItem('scanDomain');
    
    if (!storedResult || storedDomain !== domain) {
      // No result found, redirect to home
      router.push('/');
      return;
    }
    
    // Use requestAnimationFrame to avoid cascading renders
    requestAnimationFrame(() => {
      setResult(JSON.parse(storedResult));
      setIsLoading(false);
    });
  }, [domain, router]);

  const handleReset = () => {
    sessionStorage.removeItem('scanResult');
    sessionStorage.removeItem('scanDomain');
    router.push('/');
  };

  if (isLoading || !result) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-muted">Loading results...</p>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.1), transparent)`,
            }}
          />
        </div>

        <main className="relative z-10 px-4 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <ResultsDashboard result={result} onReset={handleReset} />
          </motion.div>
        </main>
      </div>
    </MainLayout>
  );
}
