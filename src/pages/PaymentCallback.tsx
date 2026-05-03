import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PaymentCallback = () => {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref");
  const [status, setStatus] = useState<"checking" | "success" | "pending">("checking");
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      if (!reference || !user) {
        setStatus("pending");
        return;
      }
      const { data } = await supabase
        .from("payments")
        .select("status")
        .eq("reference", reference)
        .maybeSingle();

      if (cancelled) return;
      if (data?.status === "success") {
        setStatus("success");
        return;
      }
      attempts++;
      if (attempts < 8) setTimeout(poll, 2000);
      else setStatus("pending");
    };
    poll();

    return () => { cancelled = true; };
  }, [reference, user]);

  return (
    <div className="container max-w-md py-16 text-center space-y-5">
      {status === "success" ? (
        <>
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
          <h1 className="font-display text-2xl font-bold">Payment confirmed!</h1>
          <p className="text-muted-foreground text-sm">
            Your tier is active for the next 7 days. Enjoy the tips.
          </p>
        </>
      ) : (
        <>
          <Clock className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="font-display text-2xl font-bold">Processing your payment</h1>
          <p className="text-muted-foreground text-sm">
            We're confirming your payment with Paystack. This usually takes a few seconds — your tier
            will activate automatically.
          </p>
        </>
      )}
      <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
};

export default PaymentCallback;
