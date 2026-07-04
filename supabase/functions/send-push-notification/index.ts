import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id: string;
    recipient_id: string;
    title: string;
    body?: string | null;
    order_id?: string | null;
    table_number?: number | null;
    type?: string | null;
    payload?: Record<string, unknown> | null;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    const requestSecret = req.headers.get("x-webhook-secret");

    if (!webhookSecret || requestSecret !== webhookSecret) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase env is not configured");
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys are not configured");
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = (await req.json()) as WebhookPayload;
    const notification = payload.record;

    if (!notification?.id || !notification.recipient_id) {
      return new Response(JSON.stringify({ skipped: true, reason: "invalid_payload" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", notification.recipient_id);

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no_subscriptions" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pushPayload = JSON.stringify({
      title: notification.title || "Новое уведомление",
      body: notification.body || "Откройте приложение",
      url: notification.order_id
        ? `/orders/${notification.order_id}`
        : "/notifications",
      order_id: notification.order_id,
      table_number: notification.table_number,
      type: notification.type,
    });

    let sent = 0;
    const deadSubscriptionIds: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload
        );

        sent += 1;
      } catch (err) {
        const statusCode =
          typeof err === "object" && err !== null && "statusCode" in err
            ? Number((err as { statusCode?: number }).statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          deadSubscriptionIds.push(sub.id);
        } else {
          console.error("Push send error:", err);
        }
      }
    }

    if (deadSubscriptionIds.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", deadSubscriptionIds);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent,
        removed: deadSubscriptionIds.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(err);

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "unknown_error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
