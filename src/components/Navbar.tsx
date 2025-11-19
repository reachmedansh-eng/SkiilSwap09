import { Link, useNavigate, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { MessageSquare, Menu, X, Home, Search, Repeat, Headset, Mailbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inboxCount, setInboxCount] = useState(0); // exchange/request notifications only
  const [chatUnread, setChatUnread] = useState(0); // chat-only unread

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUnreadBuckets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Count unread chat messages (chat widget may also show its own badge)
    const { count: messageCount, error: msgError } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("receiver_id", session.user.id)
      .eq("read", false);
    
    // Count pending exchange requests (inbox items)
    const { count: exchangeCount, error: exchError } = await supabase
      .from("exchanges")
      .select("*", { count: 'exact', head: true })
      .eq("provider_id", session.user.id)
      .eq("status", "pending");
    
    setChatUnread(messageCount || 0);
    setInboxCount(exchangeCount || 0);
  };

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread/inbox buckets
    fetchUnreadBuckets();

    // Real-time subscription for unread messages and exchange requests
    const channel = supabase
      .channel('navbar-unread-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          fetchUnreadBuckets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          fetchUnreadBuckets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exchanges',
          filter: `provider_id=eq.${user.id}`
        },
        () => {
          fetchUnreadBuckets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exchanges',
          filter: `provider_id=eq.${user.id}`
        },
        () => {
          fetchUnreadBuckets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear only app-specific data
    localStorage.removeItem('skillswap_credits');
    localStorage.removeItem('darkMode');
    localStorage.removeItem('emailNotif');
    
    // Navigate to welcome page
    navigate("/");
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/listings", label: "Listings", icon: Search },
    { path: "/exchanges", label: "Swaps", icon: Repeat },
    { path: "/support", label: "Support", icon: Headset },
  ];

  return (
    <nav className="border-b-4 border-primary/30 bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Logo />

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden lg:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-sm pixel-corners transition-all ${
                    isActive(link.path)
                      ? "bg-transparent text-primary border-2 border-primary ring-2 ring-primary/70"
                      : "hover:bg-primary/10 text-foreground"
                  }`}
                >
                  <link.icon className="inline-block mr-2 w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Inbox icon (exchange requests only) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative pixel-corners hover:bg-primary/10"
                  onClick={() => navigate('/inbox')}
                  title="Inbox (requests)"
                >
                  <Mailbox className={`w-5 h-5 ${inboxCount > 0 ? 'text-amber-500' : ''}`} />
                  {inboxCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center pixel-corners">
                      {inboxCount > 9 ? '9+' : inboxCount}
                    </span>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="hidden md:flex pixel-corners"
                >
                  Sign Out
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden pixel-corners"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X /> : <Menu />}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="pixel-corners"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/signup")}
                  className="pixel-corners pixel-shadow"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="lg:hidden mt-4 pt-4 border-t-2 border-border space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-sm pixel-corners transition-all ${
                  isActive(link.path)
                    ? "bg-transparent text-primary border-2 border-primary ring-2 ring-primary/70"
                    : "hover:bg-primary/10 text-foreground"
                }`}
              >
                <link.icon className="inline-block mr-2 w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full pixel-corners mt-4"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
