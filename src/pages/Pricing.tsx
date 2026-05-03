import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Crown, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const tiers = [
  {
    id: "pro" as const,
    name: "Pro",
    price: "₦5,000",
    period: "per week",
    icon: Zap,
    accent: "text-amber-500",
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    features: [
      "Access to all Pro tips",
      "Higher confidence predictions",
      "Daily premium picks",
      "7 days unlimited access",
    ],
  },
  {
    id: "vip" as const,
    name: "VIP",
    price: "₦12,000",
    period: "per week",
    icon: Crown,
    accent: "text-fuchsia-500",
    border: "border-fuchsia-500/40",
    bg: "bg-gradient-to-br from-fuchsia-500/10 to-violet-500/10",
    features: [
      "Everything in Pro",
      "Exclusive VIP-only tips",
      "Highest confidence picks",
      "Priority support",
      "7 days unlimited access",
    ],
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const subscribe = async (tier: "pro" | "vip") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-init", {
        body: { tier },
      });
      if (error) throw error;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start checkout");
      setLoading(null);
    }
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Unlock premium tips</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Weekly access. Cancel anytime — pay only when you want to play.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {tiers.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.id}
              className={`card-elevated rounded-2xl border ${t.border} ${t.bg} p-6 space-y-5`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${t.accent}`} />
                  <span className="font-display font-bold text-xl">{t.name}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-display font-bold text-4xl">{t.price}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{t.period}</div>
              </div>

              <ul className="space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${t.accent}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => subscribe(t.id)}
                disabled={loading === t.id}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {loading === t.id ? "Redirecting..." : `Subscribe to ${t.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {!user && (
        <p className="text-center text-sm text-muted-foreground">
          You'll need to <Link to="/auth" className="text-primary underline">log in</Link> first.
        </p>
      )}
    </div>
  );
};

export default Pricing;
