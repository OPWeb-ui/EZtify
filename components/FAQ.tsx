import React from 'react';
import { Shield, Zap, HardDrive } from 'lucide-react';

export const FAQ = () => {
  const items = [
    {
      icon: <Shield className="w-4 h-4 text-brand-purple" />,
      q: "Is it private?",
      a: "Yes. Files never leave your browser."
    },
    {
      icon: <Zap className="w-4 h-4 text-brand-blue" />,
      q: "Does it work offline?",
      a: "Yes. Once loaded, no internet needed."
    },
    {
      icon: <HardDrive className="w-4 h-4 text-brand-mint" />,
      q: "File limits?",
      a: "Depends on your device RAM (approx 25MB/img)."
    }
  ];

  return (
    <section className="max-w-3xl mx-auto px-6 pb-24 pt-8 border-t border-slate-100 dark:border-charcoal-800">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className="group p-4 rounded-xl hover:bg-white/60 dark:hover:bg-charcoal-900/60 transition-colors duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-charcoal-800 flex items-center justify-center border border-slate-100 dark:border-charcoal-700 shadow-sm">
                {item.icon}
              </div>
              <h3 className="font-bold text-charcoal-700 dark:text-slate-300 text-sm">{item.q}</h3>
            </div>
            <p className="text-xs text-charcoal-500 dark:text-slate-500 leading-relaxed pl-11">{item.a}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center opacity-50 text-[10px] text-charcoal-400 dark:text-slate-600 uppercase tracking-widest">
        EZtify • Premium & Private
      </div>
    </section>
  );
};