import { Link } from "react-router-dom";
import { CheckCircle2, ShieldAlert, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Footer = () => {
  const { isAdmin } = useAuth();
  return (
    <footer className="border-t border-border/50 mt-20 bg-background/60">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" strokeWidth={2.5} />
              <span className="font-display font-bold text-lg">TIPSTIK</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Expert sport predictions with reasoning. Updated daily.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Sports</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/football" className="hover:text-primary">Football</Link></li>
              <li><Link to="/basketball" className="hover:text-primary">Basketball</Link></li>
              <li><Link to="/tennis" className="hover:text-primary">Tennis</Link></li>
              <li><Link to="/results" className="hover:text-primary">Results Archive</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              Responsible Play
            </h4>
            <p className="text-sm text-muted-foreground">
              Tipstik is for entertainment and informational purposes. Bet responsibly. 18+ only.
            </p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Tipstik. All rights reserved.</p>
          {isAdmin && (
            <Link
              to={consoleToken ? `/console/${consoleToken}` : "/console"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin Console
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};
