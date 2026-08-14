import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setIsStandalone(standalone);

    if (standalone) return; // Don't show if already installed

    // Check if dismissed recently (don't nag - show again after 3 days)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < threeDays) return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS banner after a short delay
      const timer = setTimeout(() => setShowInstallBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: Listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install banner after a short delay
      setTimeout(() => setShowInstallBanner(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isStandalone || !showInstallBanner) return null;

  return (
    <div className="install-prompt-banner">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">
          {isIOS ? <Share size={20} /> : <Download size={20} />}
        </div>
        <div className="install-prompt-text">
          <p className="install-prompt-title">Install Hisaab App</p>
          <p className="install-prompt-desc">
            {isIOS
              ? 'Tap Share ⎋ then "Add to Home Screen"'
              : 'Install for quick access & offline use'}
          </p>
        </div>
      </div>
      <div className="install-prompt-actions">
        {!isIOS && (
          <button className="install-prompt-btn" onClick={handleInstallClick}>
            Install
          </button>
        )}
        <button className="install-prompt-close" onClick={handleDismiss} aria-label="Dismiss">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
