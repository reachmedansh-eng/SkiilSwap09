import { Link, useNavigate, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Inbox as InboxIcon, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/listings", label: "Listings", icon: "🔍" },
    { path: "/exchanges", label: "Swaps", icon: "🔄" },
    { path: "/support", label: "Support", icon: "💬" },
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
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative pixel-corners hover:bg-primary/10"
                  onClick={() => navigate('/inbox')}
                  title="Inbox"
                >
                  <InboxIcon className="w-5 h-5" />
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
                <span className="mr-2">{link.icon}</span>
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
