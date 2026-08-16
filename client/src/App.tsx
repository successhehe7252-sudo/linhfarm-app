/* Vườn Sáng: the app shell keeps navigation persistent and protects routes with Supabase Auth. */
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { Leaf } from "lucide-react";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-600/10 mb-4 animate-bounce">
          <img
            src="/logo.webp"
            alt="LinhFarm"
            className="w-12 h-12 object-contain rounded-xl"
            onError={e => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <Leaf size={28} className="text-emerald-600 hidden group-has-[:hidden]:block" />
        </div>
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm bg-white border border-emerald-200/80 px-4 py-2 rounded-full shadow-sm">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang kiểm tra phiên làm việc LinhFarm...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Home />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <Toaster position="top-center" richColors />
            <PWAInstallPrompt />
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
