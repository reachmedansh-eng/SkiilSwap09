import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Persistent credits badge: reads from profiles. Falls back to localStorage.
export function CreditsBadge() {
  const [credits, setCredits] = useState<number>(10);
  const location = useLocation();
  
  // Hide on auth pages
  const hideOnPages = ['/', '/auth', '/signup', '/welcome'];
  const shouldHide = hideOnPages.includes(location.pathname);

  const loadCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('credits')
          .eq('id', session.user.id)
          .single();
        if (!error && data && typeof (data as any).credits === 'number') {
          const val = (data as any).credits as number;
          setCredits(val);
          localStorage.setItem('skillswap_credits', String(val));
          return;
        }
      }
    } catch (e) {
      // ignore and fall back
    }
    const stored = localStorage.getItem("skillswap_credits");
    const parsed = stored ? parseFloat(stored) : 10;
    setCredits(isNaN(parsed) ? 10 : parsed);
  };

  useEffect(() => {
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

  if (shouldHide) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[60] select-none"
      aria-label={`You have ${credits} credits`}
    >
      <div className="bg-card/90 backdrop-blur border-4 border-soft-blue/40 text-foreground flex items-center gap-2 px-3 py-2 rounded-sm pixel-corners shadow-lg">
        <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-mustard to-soft-blue rounded-sm border-2 border-mustard/70 pixel-corners">
          <Coins className="w-4 h-4 text-indigo drop-shadow" />
        </div>
        <div className="leading-tight">
          <div className="text-xs text-indigo/80">Credits</div>
          <div className="font-bold text-teal">{credits.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
