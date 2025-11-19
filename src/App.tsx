import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Listings from "./pages/Listings";
import Exchanges from "./pages/Exchanges";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import MyListings from "./pages/MyListings";
import ProposeSwap from "./pages/ProposeSwap";
import Inbox from "./pages/Inbox";
import Chat from "./pages/Chat";
import ScheduleSession from "./pages/ScheduleSession";
import { CreditsBadge } from "@/components/CreditsBadge";
import { ChatWidget } from "@/components/ChatWidget";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Apply dark mode from localStorage on app load
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
      document.documentElement.classList.add('dark');
    } else if (darkMode === 'false') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/listings" element={<ProtectedRoute><Listings /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            <Route path="/propose-swap" element={<ProtectedRoute><ProposeSwap /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/exchanges" element={<ProtectedRoute><Exchanges /></ProtectedRoute>} />
            <Route path="/schedule-session/:exchangeId" element={<ProtectedRoute><ScheduleSession /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CreditsBadge />
          <ChatWidget />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
