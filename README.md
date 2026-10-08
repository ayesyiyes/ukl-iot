# FoodGuard

FoodGuard is a food spoilage monitoring dashboard for an ESP sensor device. The ESP sends HTTP requests to the Next.js server on the local network. Next.js validates readings and accesses the existing Supabase PostgreSQL database using a server-only service role key; the browser never receives that key.

## Requirements

- Node.js 20.9 or newer and npm
- An existing Supabase project with the `sensor_data` table
- An ESP that sends `temperature`, `humidity`, `mq_value`, and `moisture`

## Configuration

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (reserved for public/client use; not used for privileged database requests)
- `SUPABASE_SERVICE_ROLE_KEY`: server-side service role key; never expose it in client code or commit it

`.env.local` is ignored by Git. The service role key is only read in `lib/supabase.ts` and used by server Route Handlers. Keep RLS enabled and do not send the key to the ESP.

The existing database is left intact. If the table has not been created yet, run the existing [`database.sql`](database.sql) in the Supabase SQL Editor; it uses `create table if not exists` and does not drop existing data.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. ESP traffic to the local Next.js server remains HTTP; Next.js connects to Supabase over HTTPS.

## ESP request

Send an HTTP `POST` to `http://<computer-ip>:3000/api/sensor` with JSON or form fields:

```json
{"temperature":28.4,"humidity":72,"mq_value":312,"moisture":46}
```

The legacy path `/api/sensor.php` is rewritten to `/api/sensor` for existing ESP firmware. To keep firmware posting to the existing XAMPP URL on port 80 (`/iot%20ukl/api/sensor.php`), leave Apache running and enable `mod_rewrite`, `mod_proxy`, and `mod_proxy_http`; the included `.htaccess` forwards that request to Next.js on `127.0.0.1:3000`. Allow inbound HTTP traffic to Apache on the host firewall. Alternatively, a device configured for a direct request can POST to `http://<computer-ip>:3000/api/sensor`. No Supabase credentials are sent to the device.

## API endpoints

- `POST /api/sensor` validates all four numeric readings and inserts them into `sensor_data`. JSON and form-encoded posts are accepted.
- `GET /api/latest` returns the newest reading or `data: null` when there is none.
- `GET /api/history?range=1h|6h|24h` returns up to 1000 timestamped rows for charts.

Temperature, humidity, and non-negative value checks are performed by the ingest endpoint. MQ thresholds are raw-value thresholds, not ppm. Moisture is stored and displayed as sent by the ESP; no unit or scale is assumed. Starter alert thresholds are in `app/ui/dashboard.tsx` and should be calibrated for the food and sensor arrangement.

The dashboard polls every 10 seconds. Device status is Online when the latest reading is no older than 30 seconds. Until the first row exists, the dashboard shows `NO DATA` rather than inferring a safe condition. Chart.js and the selected fonts load from public CDNs, so those visual dependencies need internet access. Dashboard thresholds are starter values, not food-safety certification.