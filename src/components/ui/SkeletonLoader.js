'use client';

export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-800 ${className}`} />;
}

export default function SkeletonLoader({ lines = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className={i === 0 ? 'h-5 w-2/3' : 'h-4 w-full'} />
      ))}
    </div>
  );
}
