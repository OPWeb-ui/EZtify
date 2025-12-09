import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from './Toast';
import { ToastMessage, AppMode } from '../types';
import { nanoid } from 'nanoid';
import { AnimatePresence, motion } from 'framer-motion';
import { pageVariants } from '../utils/animations';
import { PageLoader } from './PageLoader';

export const Layout: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const location = useLocation();

  // Determine current mode from URL with strict checking
  let currentMode: AppMode = 'home';
  const path = location.pathname;

  if (path === '/' || path === '') {
    currentMode = 'home';
  } else if (path.includes('images-to-pdf')) {
    currentMode = 'image-to-pdf';
  } else if (path.includes('pdf-to-images')) {
    currentMode = 'pdf-to-image';
  } else if (path.includes('compress-pdf')) {
    currentMode = 'compress-pdf';
  } else if (path.includes('merge-pdf')) {
    currentMode = 'merge-pdf';
  } else if (path.includes('split-pdf')) {
    currentMode = 'split-pdf';
  } else if (path.includes('zip-it')) {
    currentMode = 'zip-files';
  }

  // Clear toasts when switching pages
  useEffect(() => {
    setToasts([]);
  }, [location.pathname]);

  const addToast = (title: string, message: string, type: 'warning' | 'error' = 'warning', duration?: number) => {
    const id = nanoid();
    setToasts(prev => {
      const updated = [...prev, { id, title, message, type, duration }];
      return updated.slice(-5);
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  return (
    <div className="min-h-screen bg-pastel-bg dark:bg-charcoal-950 text-charcoal-600 dark:text-slate-300 flex flex-col font-sans selection:bg-brand-purple/20 dark:selection:bg-brand-purple/40 transition-colors duration-300">
      <ToastContainer toasts={toasts} onDismiss={removeToast} isMobile={isMobile} />
      
      {/* Global Header */}
      <Header currentMode={currentMode} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full pt-16">
        <AnimatePresence mode="wait">
          {/* We wrap the Outlet in a motion.div keyed by pathname to trigger transitions */}
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            {/* Suspense acts here to show loader only in content area, not unmounting header */}
            <Suspense fallback={<PageLoader />}>
              <Outlet context={{ addToast }} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
};

export function useToast() {
  return useOutletContext<{ addToast: (title: string, msg: string, type?: 'warning'|'error', duration?: number) => void }>();
}