import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Coins } from "lucide-react";

// Simple credits badge fixed at bottom-left. Starts with 10 credits.
// Future: persist to profile or Supabase when a credits field exists.
export function CreditsBadge() {
  const [credits, setCredits] = useState<number>(10);
  const location = useLocation();
  
  // Hide on auth pages
  const hideOnPages = ['/', '/auth', '/signup', '/welcome'];
  const shouldHide = hideOnPages.includes(location.pathname);

  // Optional: hydrate from localStorage to keep it consistent across reloads
  useEffect(() => {
    const loadCredits = () => {
      const stored = localStorage.getItem("skillswap_credits");
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed)) setCredits(parsed);
      } else {
        localStorage.setItem("skillswap_credits", String(10));
      }
    };
    
    // Load credits initially
    loadCredits();
    
    // Listen for credits change events
    const handleCreditsChange = () => {
      loadCredits();
    };
    
    // Also reload when window becomes visible (e.g., switching tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCredits();
      }
    };
    
    window.addEventListener('creditsChanged', handleCreditsChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('creditsChanged', handleCreditsChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("skillswap_credits", String(credits));
  }, [credits]);

  if (shouldHide) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[60] select-none"
      aria-label={`You have ${credits} credits`}
    >
      <div className="bg-card/90 backdrop-blur border-4 border-primary/40 text-foreground flex items-center gap-2 px-3 py-2 rounded-sm pixel-corners shadow-lg">
        <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-warning to-accent rounded-sm border-2 border-warning/70 pixel-corners">
          <Coins className="w-4 h-4 text-yellow-200 drop-shadow" />
        </div>
        <div className="leading-tight">
          <div className="text-xs text-muted-foreground">Credits</div>
          <div className="font-bold text-foreground">{credits.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
