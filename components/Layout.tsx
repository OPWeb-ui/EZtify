
import React, { useState, useEffect, Suspense, createContext, useContext, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from './Toast';
import { SuccessIndicator } from './SuccessIndicator';
import { ToastMessage, AppMode, ToastAction } from '../types';
import { nanoid } from 'nanoid';
import { AnimatePresence, motion } from 'framer-motion';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { CookieConsentBanner } from './CookieConsentBanner';
import { pageVariants } from '../utils/animations';
import { FileProcessingLoader } from './FileProcessingLoader';
import { allTools } from '../utils/tool-list';
import { incrementToolUsage } from '../services/usageTracker';

// --- CONTEXT DEFINITION ---
interface LayoutContextType {
  addToast: (
    title: string,
    message: string,
    type?: 'warning' | 'error' | 'undo' | 'success' | 'info',
    durationOrAction?: number | ToastAction
  ) => string;
  removeToast: (id: string) => void;
  isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a Layout provider');
  }
  return context;
};

export const Layout: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [successActive, setSuccessActive] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Usage Tracking ---
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === lastTrackedPath.current) return;
    lastTrackedPath.current = currentPath;

    const tool = allTools.find(t => t.path === currentPath);
    if (tool) {
      incrementToolUsage(tool.id);
    }
  }, [location.pathname]);

  // --- Success Indicator Dismissal Logic ---
  const dismissSuccess = useCallback(() => {
    setSuccessActive(false);
    if (successTimer.current) clearTimeout(successTimer.current);
  }, []);

  useEffect(() => {
    if (!successActive) return;

    // Auto-dismiss after 1s
    successTimer.current = setTimeout(() => {
      setSuccessActive(false);
    }, 1200);

    // Immediate dismiss on interaction
    const handleInteraction = () => dismissSuccess();
    
    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('scroll', handleInteraction, { capture: true });
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('scroll', handleInteraction, { capture: true });
      window.removeEventListener('keydown', handleInteraction);
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, [successActive, dismissSuccess]);


  const addToast = useCallback((
    title: string,
    message: string,
    type: 'warning' | 'error' | 'undo' | 'success' | 'info' = 'info',
    durationOrAction?: number | ToastAction
  ) => {
    // --- 1. SUCCESS (Center Indicator) ---
    if (type === 'success') {
      // Dismiss any existing success first to restart animation if needed, 
      // or just ensure it stays visible. 
      setSuccessActive(false);
      requestAnimationFrame(() => setSuccessActive(true));
      return 'success';
    }

    // --- 2. INFO (Chatty -> Silent) ---
    if (type === 'info') {
      // Per rules: "The UI must NEVER feel chatty."
      // Info toasts (e.g. tips, 'Added files') are silenced or should be handled by local UI.
      // We drop them here to enforce the new severity model strictly.
      return 'info-silenced';
    }

    // --- 3. WARNING / ERROR (Toasts) ---
    const id = nanoid();
    let duration = type === 'warning' ? 4000 : Infinity; // Errors don't auto-dismiss by default
    let action: ToastAction | undefined;

    if (typeof durationOrAction === 'number') {
      duration = durationOrAction;
    } else if (durationOrAction) {
      action = durationOrAction;
      duration = 6000; // Warnings with actions need time
    }

    setToasts(prev => {
      // Limit stacks: Error (1), Warning (2)
      // Since we mix them in one array, let's just cap total at 2 for tidiness.
      const current = [...prev];
      if (current.length >= 2) {
        current.shift();
      }
      return [...current, { id, title, message, type, duration, action }];
    });

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Determine current mode
  const currentPath = location.pathname;
  const currentTool = allTools.find(t => t.path === currentPath);
  const mode = (currentTool?.id || 'home') as AppMode;

  // PWA & Cookie Logic
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('eztify-cookie-consent');
    if (!consent) setShowCookieBanner(true);
  }, []);

  const handlePwaInstall = () => setShowPwaPrompt(false);
  const handlePwaDismiss = () => {
    setShowPwaPrompt(false);
    localStorage.setItem('eztify-pwa-dismissed', 'true');
  };
  const handleCookieAccept = () => {
    localStorage.setItem('eztify-cookie-consent', 'accepted');
    setShowCookieBanner(false);
  };
  const handleCookieReject = () => {
    localStorage.setItem('eztify-cookie-consent', 'rejected');
    setShowCookieBanner(false);
  };

  return (
    <LayoutContext.Provider value={{ addToast, removeToast, isMobile }}>
      <div className="flex flex-col h-[100dvh] bg-nd-base text-nd-primary overflow-hidden">
        <Header currentMode={mode} isMobile={isMobile} />
        
        <main className="flex-1 relative overflow-hidden flex flex-col pt-12">
          <Suspense fallback={<FileProcessingLoader />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                className="w-full h-full flex flex-col"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>

        <SuccessIndicator visible={successActive} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} isMobile={isMobile} />
        
        <AnimatePresence>
          {showPwaPrompt && (
            <PwaInstallPrompt onInstall={handlePwaInstall} onDismiss={handlePwaDismiss} />
          )}
          {showCookieBanner && (
            <CookieConsentBanner onAccept={handleCookieAccept} onReject={handleCookieReject} />
          )}
        </AnimatePresence>
      </div>
    </LayoutContext.Provider>
  );
};
