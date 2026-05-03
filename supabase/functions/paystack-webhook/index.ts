import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const raw = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!secret) return new Response("Not configured", { status: 500 });
    if (!signature) return new Response("Missing signature", { status: 401 });

    const expected = createHmac("sha512", secret).update(raw).digest("hex");
    if (expected !== signature) {
      console.error("Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(raw);
    console.log("Paystack event:", event?.event);

    if (event?.event !== "charge.success") {
      return new Response("ignored", { status: 200 });
    }

    const reference = event?.data?.reference as string;
    if (!reference) return new Response("no reference", { status: 400 });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: payment, error: pErr } = await admin
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (pErr || !payment) {
      console.error("payment lookup failed", pErr, reference);
      return new Response("payment not found", { status: 404 });
    }

    if (payment.status === "success") {
      return new Response("already processed", { status: 200 });
    }

    const { error: actErr } = await admin.rpc("activate_paid_tier", {
      _user_id: payment.user_id,
      _tier: payment.tier,
      _days: 7,
    });
    if (actErr) {
      console.error("activate_paid_tier error", actErr);
      return new Response("activation failed", { status: 500 });
    }

    await admin.from("payments").update({ status: "success" }).eq("reference", reference);

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
});
