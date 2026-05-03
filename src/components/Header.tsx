import { Link, NavLink } from "react-router-dom";
import { CheckCircle2, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/football", label: "Football" },
  { to: "/basketball", label: "Basketball" },
  { to: "/tennis", label: "Tennis" },
  { to: "/results", label: "Results" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <CheckCircle2 className="h-7 w-7 text-primary" strokeWidth={2.5} />
            <div className="absolute inset-0 blur-md bg-primary/40 -z-10" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">TIPSTIK</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-warning" asChild><Link to="/pricing">Go Pro</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link to="/pricing">VIP</Link></Button>
          {user ? (
            <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth">Login</Link></Button>
              <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/auth?mode=register">Register</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background border-border/50">
            <div className="flex flex-col gap-1 mt-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="border-t border-border/50 my-3" />
              <Button variant="ghost" className="justify-start text-warning" asChild>
                <Link to="/pricing" onClick={() => setOpen(false)}>Go Pro</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link to="/pricing" onClick={() => setOpen(false)}>VIP</Link>
              </Button>
              {user ? (
                <Button variant="outline" onClick={() => { signOut(); setOpen(false); }}>Sign Out</Button>
              ) : (
                <>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/auth" onClick={() => setOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild className="bg-primary text-primary-foreground">
                    <Link to="/auth?mode=register" onClick={() => setOpen(false)}>Register</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
