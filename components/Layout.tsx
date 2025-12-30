
import React, { useState, useEffect, Suspense, createContext, useContext, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from './Toast';
import { SuccessIndicator } from './SuccessIndicator';
import { SupportSection } from './SupportSection';
import { ToastMessage, AppMode, ToastAction } from '../types';
import { nanoid } from 'nanoid';
import { AnimatePresence, motion } from 'framer-motion';
import { CookieConsentBanner } from './CookieConsentBanner';
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
  registerUrl: (url: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a Layout provider');
  }
  return context;
};

// Global registry for Blob URLs created during a session
const urlRegistry = new Set<string>();

// Strictly Opacity-based variants to prevent structural shifting during navigation
const navigationVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }
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

  // --- Global Memory Cleanup ---
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === lastTrackedPath.current) return;
    
    // Purge previous session URLs
    urlRegistry.forEach(url => {
        try { URL.revokeObjectURL(url); } catch (e) {}
    });
    urlRegistry.clear();
    
    lastTrackedPath.current = currentPath;

    const tool = allTools.find(t => t.path === currentPath);
    if (tool) {
      incrementToolUsage(tool.id);
    }
  }, [location.pathname]);

  const registerUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) {
        urlRegistry.add(url);
    }
  }, []);

  const dismissSuccess = useCallback(() => {
    setSuccessActive(false);
    if (successTimer.current) clearTimeout(successTimer.current);
  }, []);

  useEffect(() => {
    if (!successActive) return;
    successTimer.current = setTimeout(() => setSuccessActive(false), 1200);
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
    if (type === 'success') {
      setSuccessActive(false);
      requestAnimationFrame(() => setSuccessActive(true));
      return 'success';
    }
    if (type === 'info') return 'info-silenced';

    const id = nanoid();
    let duration = type === 'warning' ? 4000 : Infinity;
    let action: ToastAction | undefined;

    if (typeof durationOrAction === 'number') duration = durationOrAction;
    else if (durationOrAction) { action = durationOrAction; duration = 6000; }

    setToasts(prev => {
      const current = [...prev];
      if (current.length >= 2) current.shift();
      return [...current, { id, title, message, type, duration, action }];
    });
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const currentPath = location.pathname;
  const currentTool = allTools.find(t => t.path === currentPath);
  const mode = (currentTool?.id || 'home') as AppMode;

  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('eztify-cookie-consent');
    if (!consent) setShowCookieBanner(true);
  }, []);

  return (
    <LayoutContext.Provider value={{ addToast, removeToast, isMobile, registerUrl }}>
      <div className="flex flex-col h-[100dvh] bg-nd-base text-nd-primary overflow-hidden isolate">
        {/* Global UI Components - Never unmount to prevent flickering */}
        <Header currentMode={mode} isMobile={isMobile} />
        
        <main className="flex-1 relative overflow-hidden flex flex-col pt-16">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={navigationVariants}
              className="w-full h-full flex flex-col relative"
            >
              <Suspense fallback={<FileProcessingLoader />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Persistence layer */}
        <SupportSection />
        <SuccessIndicator visible={successActive} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} isMobile={isMobile} />
        
        <AnimatePresence>
          {showCookieBanner && (
            <CookieConsentBanner 
                onAccept={() => { localStorage.setItem('eztify-cookie-consent', 'accepted'); setShowCookieBanner(false); }} 
                onReject={() => { localStorage.setItem('eztify-cookie-consent', 'rejected'); setShowCookieBanner(false); }} 
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutContext.Provider>
  );
};
