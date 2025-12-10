import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, MessageSquare } from 'lucide-react';
import { buttonTap, modalVariants } from '../utils/animations';
import { useLayoutContext } from './Layout';

interface FeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureRequestModal: React.FC<FeatureRequestModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useLayoutContext();
  const [feature, setFeature] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feature.trim()) {
      addToast("Missing Information", "Please describe the feature you'd like to see.", "error");
      return;
    }

    setIsSubmitting(true);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Construct Mailto
    const subject = encodeURIComponent("Feature Request for EZtify");
    const body = encodeURIComponent(`Feature Request:\n${feature}\n\nUser Email: ${email || 'Not provided'}`);
    const mailtoLink = `mailto:eztifyapps@gmail.com?subject=${subject}&body=${body}`;

    // Open email client
    window.open(mailtoLink, '_blank');

    addToast("Request Sent", "Opening your email client to send the request!", "warning");
    
    setIsSubmitting(false);
    setFeature('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-charcoal-700 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-charcoal-800 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-purple" />
                Suggest a Feature
              </h3>
              <button onClick={onClose} className="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  What should we build?
                </label>
                <textarea
                  value={feature}
                  onChange={(e) => setFeature(e.target.value)}
                  placeholder="I wish EZtify could..."
                  className="w-full h-32 p-3 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/50 outline-none resize-none text-sm text-charcoal-700 dark:text-slate-200 placeholder:text-charcoal-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="So we can update you"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple/50 outline-none text-sm text-charcoal-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  whileHover={{ backgroundColor: "rgba(241, 245, 249, 1)" }}
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={buttonTap}
                  whileHover={{ scale: 1.02 }}
                  disabled={isSubmitting}
                  type="submit"
                  className="px-6 py-2 bg-brand-purple text-white font-bold rounded-lg shadow-lg shadow-brand-purple/25 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Request
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
