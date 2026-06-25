import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline capabilities
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a bit before showing to not be too aggressive
      setTimeout(() => setShowPrompt(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-sm glass-card-strong rounded-2xl p-4 border border-dark-600 bg-dark-900 shadow-2xl flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <img src="/pwa-192x192.png" alt="Priorify Icon" className="w-12 h-12 rounded-xl" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-dark-100">Install Priorify App</span>
              <span className="text-xs text-dark-300">Add to home screen for offline access</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="bg-accent-blue text-white p-2 rounded-xl hover:bg-accent-blue/90 transition-colors shadow-lg shadow-accent-blue/20"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleDismiss}
              className="text-dark-400 hover:text-dark-200 p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
