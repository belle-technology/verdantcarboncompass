import { Link } from "@tanstack/react-router";
import { Leaf, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";

export default function SiteNav() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl">
          <Leaf className="h-4 w-4 text-primary" /> Verdant
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/"
            className="rounded-full px-3 py-1.5 text-foreground/70 transition-colors hover:text-primary"
          >
            Calculator
          </Link>
          {user && (
            <Link
              to="/history"
              className="rounded-full px-3 py-1.5 text-foreground/70 transition-colors hover:text-primary"
            >
              My history
            </Link>
          )}
          <ThemeToggle />
          {user ? (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => signOut()}>
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
