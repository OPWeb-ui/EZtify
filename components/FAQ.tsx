import React from 'react';
import { Shield, Zap, HardDrive } from 'lucide-react';

export const FAQ = () => {
  const items = [
    {
      icon: <Shield className="w-4 h-4 text-brand-purple" />,
      q: "Private & Secure",
      a: "Files are processed locally."
    },
    {
      icon: <Zap className="w-4 h-4 text-brand-blue" />,
      q: "No Installation",
      a: "Works in your browser."
    },
    {
      icon: <HardDrive className="w-4 h-4 text-brand-mint" />,
      q: "Client-Side",
      a: "No server uploads."
    }
  ];

  return (
    <section className="max-w-lg mx-auto px-6 pb-20 pt-4">
      <div className="grid grid-cols-1 gap-2">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-transparent hover:border-slate-200 dark:hover:border-charcoal-700 transition-colors backdrop-blur-sm"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-charcoal-800 flex items-center justify-center shadow-sm">
              {item.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-charcoal-800 dark:text-slate-200 text-sm">{item.q}</h3>
              <p className="text-xs text-charcoal-500 dark:text-slate-400 font-medium">{item.a}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-charcoal-800 text-[10px] font-bold text-charcoal-400 dark:text-slate-600 uppercase tracking-widest">
          EZtify • v1.0
        </span>
      </div>
    </section>
  );
};