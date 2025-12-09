import React from 'react';

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
      <span className="text-sm font-medium text-charcoal-400 dark:text-slate-500 animate-pulse">Loading Tool...</span>
    </div>
  </div>
);