# Web Push Setup

## 1. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

## 2. Frontend `.env`

```env
VITE_VAPID_PUBLIC_KEY=your_public_vapid_key
```

Restart the Vite dev server after changing `.env`.

## 3. Supabase Edge Function secrets

```bash
npx supabase secrets set VAPID_PUBLIC_KEY="your_public_vapid_key"
npx supabase secrets set VAPID_PRIVATE_KEY="your_private_vapid_key"
npx supabase secrets set VAPID_SUBJECT="mailto:admin@example.com"
npx supabase secrets set WEBHOOK_SECRET="your_random_webhook_secret"
```

`VAPID_PRIVATE_KEY` must stay only in Supabase secrets. Do not put it into frontend env files.

## 4. Deploy Edge Function

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

## 5. Database Webhook

Create a Supabase Database Webhook:

```text
Table: public.notifications
Event: INSERT
Method: POST
URL: https://PROJECT_REF.supabase.co/functions/v1/send-push-notification
Headers:
  x-webhook-secret: WEBHOOK_SECRET
  Content-Type: application/json
```

Use the same `WEBHOOK_SECRET` value that was saved in Supabase secrets.

## 6. Test notification SQL

Replace the UUIDs with real users from `public.users`.

```sql
insert into public.notifications (
  recipient_id,
  actor_id,
  type,
  title,
  body,
  order_id,
  table_number,
  payload
) values (
  'RECIPIENT_USER_ID',
  'ACTOR_USER_ID',
  'order_transfer',
  'Вам передали заказ',
  'Откройте заказ в CheckMate',
  null,
  1,
  '{}'::jsonb
);
```

Expected result:

- The row appears in `/notifications`.
- If the recipient enabled push notifications, the browser receives a Web Push notification.
- Clicking the push opens `/notifications`, or `/orders/:orderId` when `order_id` is present.
