import React, { useState, useEffect, Suspense, createContext, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from './Toast';
import { ToastMessage, AppMode, ToastAction } from '../types';
import { nanoid } from 'nanoid';
import { AnimatePresence } from 'framer-motion';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { CookieConsentBanner } from './CookieConsentBanner';

// --- CONTEXT DEFINITION ---
interface LayoutContextType {
  addToast: (
    title: string,
    message: string,
    type?: 'warning' | 'error' | 'undo' | 'success',
    durationOrAction?: number | ToastAction
  ) => string;
  removeToast: (id: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const Layout: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const location = useLocation();

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallPromptVisible, setIsInstallPromptVisible] = useState(false);

  // Cookie Consent State
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  // Determine current mode from URL
  let currentMode: AppMode = 'home';
  const path = location.pathname;
  if (path === '/' || path === '') currentMode = 'home';
  else if (path.includes('images-to-pdf')) currentMode = 'image-to-pdf';
  else if (path.includes('pdf-to-images')) currentMode = 'pdf-to-image';
  else if (path.includes('compress-pdf')) currentMode = 'compress-pdf';
  else if (path.includes('merge-pdf')) currentMode = 'merge-pdf';
  else if (path.includes('split-pdf')) currentMode = 'split-pdf';
  else if (path.includes('zip-it')) currentMode = 'zip-files';

  // PWA & Cookie Logic on initial mount
  useEffect(() => {
    // PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const dismissedAt = localStorage.getItem('eztify-install-dismissed-at');
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (dismissedAt && Date.now() - parseInt(dismissedAt) < sevenDays) {
        return;
      }
      setDeferredPrompt(e);
      setIsInstallPromptVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cookie Consent
    const consent = localStorage.getItem('eztify-cookie-consent');
    if (!consent) {
      // Delay slightly to not interfere with page load animation
      setTimeout(() => setShowCookieBanner(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setIsInstallPromptVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    setIsInstallPromptVisible(false);
    localStorage.setItem('eztify-install-dismissed-at', Date.now().toString());
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('eztify-cookie-consent', 'accepted');
    setShowCookieBanner(false);
  };

  const handleRejectCookies = () => {
    localStorage.setItem('eztify-cookie-consent', 'rejected');
    setShowCookieBanner(false);
  };

  const addToast = (
    title: string,
    message: string,
    type: 'warning' | 'error' | 'undo' | 'success' = 'warning',
    durationOrAction?: number | ToastAction
  ) => {
    const id = nanoid();
    let toast: ToastMessage = { id, title, message, type };

    if (typeof durationOrAction === 'number') toast.duration = durationOrAction;
    else if (typeof durationOrAction === 'object') {
      toast.action = durationOrAction;
      toast.duration = 6000;
    } else {
      // Default duration set to 2 seconds as requested
      toast.duration = 2000;
    }

    setToasts(prev => [...prev, toast].slice(-5));
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const contextValue = { addToast, removeToast };

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="min-h-screen bg-pastel-bg dark:bg-charcoal-950 text-charcoal-600 dark:text-slate-300 flex flex-col font-sans selection:bg-brand-purple/20 dark:selection:bg-brand-purple/40 transition-colors duration-300">
        <ToastContainer toasts={toasts} onDismiss={removeToast} isMobile={isMobile} />
        <Header currentMode={currentMode} />

        <main className="flex-1 flex flex-col relative w-full pt-16">
          <Suspense fallback={<div className="flex-1" />}>
            <div key={location.pathname} className="flex-1 flex flex-col w-full">
              <Outlet />
            </div>
          </Suspense>
        </main>
        
        <AnimatePresence>
          {showCookieBanner && (
            <CookieConsentBanner 
              onAccept={handleAcceptCookies}
              onReject={handleRejectCookies}
            />
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isInstallPromptVisible && deferredPrompt && (
            <PwaInstallPrompt 
              onInstall={handleInstall} 
              onDismiss={handleDismissInstall} 
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutContext.Provider>
  );
};

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayoutContext must be used within a Layout provider');
  }
  return context;
}