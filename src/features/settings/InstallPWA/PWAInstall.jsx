import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Div from "../Shared/StyledComponents/Div";
import PrideText from "../../../themes/PrideText";
import NeuButton from "../../shared/neumorphic/NeuButton";

const PWAInstall = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Let Chrome show its automatic prompt while also capturing the event
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    const handleAppInstalled = () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstall(false);
    }

    // Force check after a delay (sometimes the event fires before React components mount)
    const checkTimer = setTimeout(() => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
        setShowInstall(true);
      }
    }, 1000);

    return () => {
      clearTimeout(checkTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    // Clear the deferredPrompt so it can only be used once
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) {
    return null;
  }

  return (
    <Div>
      <h2>
        <PrideText text={t("settings.system.installPWA")} />
      </h2>
      <div
        style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}
      >
        <NeuButton $primary onClick={handleInstallClick}>
          {t("settings.system.installApp")}
        </NeuButton>
      </div>
    </Div>
  );
};

// Export a hook to check if PWA install is available
export const usePWAInstallAvailable = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = () => {
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsAvailable(false);
        return;
      }
      
      // Check if there's a deferred prompt
      if (window.deferredPrompt) {
        setIsAvailable(true);
        return;
      }
      
      // Listen for the prompt event
      const handler = (e) => {
        setIsAvailable(true);
      };
      
      window.addEventListener('beforeinstallprompt', handler);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    };

    checkAvailability();
  }, []);

  return isAvailable;
};

export default PWAInstall;
