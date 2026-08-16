import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, WifiOff, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("linhfarm_pwa_dismissed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // 1. Listen for browser PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 2. Listen for online / offline events
    const handleOffline = () => {
      toast.warning("Đang ngoại tuyến", {
        description: "Ứng dụng sẽ tự động đồng bộ khi có kết nối mạng trở lại.",
        icon: <WifiOff className="w-4 h-4 text-amber-500" />,
        duration: 4000,
      });
    };

    const handleOnline = () => {
      toast.success("Đã khôi phục kết nối internet!", {
        duration: 3000,
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      toast.success("Đã cài đặt LinhFarm thành công!");
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("linhfarm_pwa_dismissed", "true");
    } catch {}
  };

  if (isDismissed || !deferredPrompt) return null;

  return (
    <div className="fixed top-2 left-2 right-2 md:top-4 md:right-4 md:left-auto md:w-96 z-50 bg-white/95 backdrop-blur-md border border-emerald-200 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <Download size={18} />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-800 truncate">Cài đặt ứng dụng LinhFarm</h4>
          <p className="text-[11px] text-slate-500 truncate">Truy cập nhanh & làm việc ngoại tuyến</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Cài đặt
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Đóng thông báo cài đặt"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
