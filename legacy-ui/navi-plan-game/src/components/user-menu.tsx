import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";

interface UserMenuProps {
  onSignOut?: () => void;
}

export function UserMenu({ onSignOut }: UserMenuProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      onSignOut?.();
      navigate({ to: "/auth" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to sign out";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="User menu"
      >
        <User className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-surface shadow-lg p-2 z-40">
            <button
              onClick={() => {
                setOpen(false);
                handleSignOut();
              }}
              disabled={loading}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {loading ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
