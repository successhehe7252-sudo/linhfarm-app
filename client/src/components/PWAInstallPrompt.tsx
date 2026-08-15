import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, WifiOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

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

  // Show a gentle toast prompting the user to install LinhFarm app if supported
  useEffect(() => {
    if (!deferredPrompt) return;

    const timer = setTimeout(() => {
      toast("Cài đặt ứng dụng LinhFarm", {
        description: "Cài đặt LinhFarm lên thiết bị để truy cập nhanh chóng hơn.",
        icon: <Download className="w-4 h-4 text-emerald-600" />,
        action: {
          label: "Cài đặt ngay",
          onClick: async () => {
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === "accepted") {
              toast.success("Đã cài đặt LinhFarm thành công!");
            }
            setDeferredPrompt(null);
          },
        },
        duration: 8000,
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [deferredPrompt]);

  return null;
}
