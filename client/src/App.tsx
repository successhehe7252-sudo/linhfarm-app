/* Vườn Sáng: the app shell keeps navigation persistent and lets mobile bottom actions mirror the desktop rail. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster position="top-center" richColors /><Home /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
