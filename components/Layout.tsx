
import React, { useState, useEffect, Suspense, createContext, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from './Toast';
import { ToastMessage, AppMode, ToastAction } from '../types';
import { nanoid } from 'nanoid';
import { AnimatePresence, motion } from 'framer-motion';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { CookieConsentBanner } from './CookieConsentBanner';
import { pageVariants } from '../utils/animations';
import { FileProcessingLoader } from './FileProcessingLoader';
import { allTools } from '../utils/tool-list';

// --- CONTEXT DEFINITION ---
interface LayoutContextType {
  addToast: (
    title: string,
    message: string,
    type?: 'warning' | 'error' | 'undo' | 'success',
    durationOrAction?: number | ToastAction
  ) => string;
  removeToast: (id: string) => void;
  isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const Layout: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallPromptVisible, setIsInstallPromptVisible] = useState(false);

  // Cookie Consent State
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  // Determine current mode from URL - SINGLE SOURCE OF TRUTH
  // Derived strictly from the route path matching the tool configuration.
  // This ensures the active state always reflects the URL, regardless of navigation method.
  const path = location.pathname;
  const activeTool = allTools.find(t => path === t.path || path.startsWith(`${t.path}/`));
  const currentMode: AppMode = activeTool ? (activeTool.id as AppMode) : 'home';

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
      setTimeout(() => setShowCookieBanner(true), 2000);
    }
    
    // Mobile Detection
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', handleResize);
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
    let duration = 3500; // Default warning

    if (type === 'success') duration = 2500;
    else if (type === 'error') duration = Infinity; // Manual dismiss only
    
    // Override if provided explicitly
    if (typeof durationOrAction === 'number') {
      duration = durationOrAction;
    } else if (typeof durationOrAction === 'object') {
      // Toast with action, usually keep longer or manual
      duration = 6000;
    }

    const toast: ToastMessage = { 
      id, 
      title, 
      message, 
      type, 
      duration,
      action: typeof durationOrAction === 'object' ? durationOrAction : undefined
    };

    // Max 2 toasts, newest replaces oldest
    setToasts(prev => {
      const current = [...prev, toast];
      if (current.length > 2) {
        return current.slice(current.length - 2);
      }
      return current;
    });
    
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const contextValue = { addToast, removeToast, isMobile };

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-[100dvh] bg-pastel-bg dark:bg-charcoal-950 text-charcoal-600 dark:text-slate-300 font-sans selection:bg-brand-purple/20 dark:selection:bg-brand-purple/40 transition-colors duration-300 overflow-hidden">
        <ToastContainer toasts={toasts} onDismiss={removeToast} isMobile={isMobile} />
        <Header currentMode={currentMode} />

        <main 
          className="flex-1 relative w-full min-h-0 overflow-hidden"
          style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top))' }}
        >
          <AnimatePresence initial={false}>
            <motion.div 
              key={location.pathname} 
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              className="absolute inset-0 w-full h-full flex flex-col bg-white dark:bg-charcoal-950 overflow-hidden"
            >
              <Suspense fallback={<FileProcessingLoader />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
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
