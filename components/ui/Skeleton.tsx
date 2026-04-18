import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse rounded-md';

  const variantStyles = {
    text: 'h-4 w-full',
    rectangular: '',
    circular: 'rounded-full',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{
        backgroundColor: 'var(--background-elevated)',
        width: width,
        height: height,
      }}
    />
  );
}

export function ScanSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Hero skeleton */}
      <div className="text-center space-y-4">
        <Skeleton variant="circular" className="mx-auto h-20 w-20" />
        <Skeleton className="mx-auto h-10 w-64" />
        <Skeleton className="mx-auto h-6 w-48" />
      </div>

      {/* Scan mode selector skeleton */}
      <div className="flex justify-center gap-3">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>

      {/* Search form skeleton */}
      <Skeleton className="h-14 w-full rounded-xl" />

      {/* Features grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
        <div className="space-y-3 p-6 rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
          <Skeleton variant="circular" className="h-12 w-12" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-3 p-6 rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
          <Skeleton variant="circular" className="h-12 w-12" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-3 p-6 rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
          <Skeleton variant="circular" className="h-12 w-12" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-xl border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--background-elevated)' }}>
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton variant="circular" className="h-24 w-24 sm:h-32 sm:w-32" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border space-y-2" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--background-elevated)' }}>
          <Skeleton className="h-8 w-8 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
        <div className="p-5 rounded-xl border space-y-2" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--background-elevated)' }}>
          <Skeleton className="h-8 w-8 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
        <div className="p-5 rounded-xl border space-y-2" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--background-elevated)' }}>
          <Skeleton className="h-8 w-8 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
      </div>

      {/* AI Analysis skeleton */}
      <div className="p-6 rounded-xl border space-y-4" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--background-elevated)' }}>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Findings skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
