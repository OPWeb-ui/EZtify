import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={`bg-slate-200/80 dark:bg-charcoal-800/80 rounded-lg animate-pulse ${className}`}
    />
  );
};
