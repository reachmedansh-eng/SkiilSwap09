import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  children: ReactNode;
};

export const ProtectedRoute = ({ children }: Props) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(!!session);
      setLoading(false);
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setIsAuthed(!!session);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="min-h-[50vh]" />;
  }

  if (!isAuthed) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
