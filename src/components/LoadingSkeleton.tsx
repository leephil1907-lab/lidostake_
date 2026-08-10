import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-input/80 dark:bg-slate-800/80 rounded-lg ${className}`}
    />
  );
}

export function BalanceSkeleton() {
  return <Skeleton className="h-3.5 w-16 inline-block rounded-md" />;
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-[24px] p-6 mb-8 border border-border-main shadow-2xl space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      <div className="bg-input/60 rounded-2xl p-4 h-[120px] border border-border-main flex flex-col justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <Skeleton className="h-14 w-full rounded-xl" />

      <div className="space-y-3 px-2 pt-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-5 space-y-4 border border-border-main shadow-sm animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-card rounded-xl border border-border-main"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function RewardsSkeleton() {
  return (
    <div className="bg-card rounded-[24px] p-6 mb-6 border border-border-main shadow-sm space-y-4 animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}

export function EarnVaultSkeleton() {
  return (
    <div className="bg-card rounded-[24px] border border-border-main shadow-sm mb-6 overflow-hidden p-6 space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-center my-2">
        <Skeleton className="w-16 h-16 rounded-xl" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-16" /></div>
        <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /></div>
        <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-28" /></div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
