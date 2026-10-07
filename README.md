# FoodGuard

Food spoilage monitoring dashboard for an ESP sensor device. The ESP sends plain HTTP to PHP; PHP validates readings and communicates with Supabase PostgreSQL over HTTPS. The browser only calls the local PHP endpoints and never receives the Supabase key.

## Requirements

- XAMPP with Apache, PHP 8.1+ and the PHP cURL extension enabled
- A Supabase project
- An ESP that can POST `temperature`, `humidity`, `mq_value`, and `moisture`

## Supabase setup

1. Open the Supabase SQL Editor and run [`database.sql`](database.sql).
2. In the Supabase project settings, copy the project URL and a server-side key. A `service_role` key bypasses Row Level Security, so keep it only on this PHP server and never commit or expose it. For production, use a restricted server-side key and suitable RLS policies.
3. Put the values in `config/supabase.php`, replacing the two local fallback placeholders, or set `SUPABASE_URL` and `SUPABASE_KEY` in the Apache/PHP environment.
4. Ensure the `config` directory is not served publicly. The included `.htaccess` denies direct access when Apache's `AllowOverride` permits it.

## Run with XAMPP

Place the project folder under `C:\xampp\htdocs` (this workspace is already under `htdocs`), start Apache in the XAMPP Control Panel, then open:

`http://localhost/iot%20ukl/`

The dashboard polls the latest reading and chart history every 10 seconds. Device status is Online when the most recent reading is no older than 30 seconds. Until the first row exists, the dashboard shows `NO DATA` rather than inferring a safe condition.

## ESP request

Send an HTTP `POST` to `http://<computer-ip>/iot%20ukl/api/sensor.php` using form fields or a JSON body:

```text
temperature=28.4
humidity=72
mq_value=312
moisture=46
```

Example JSON body:

```json
{"temperature":28.4,"humidity":72,"mq_value":312,"moisture":46}
```

The ESP and XAMPP host must be on the same network; allow inbound Apache traffic in the host firewall. This endpoint intentionally uses HTTP for ESP-to-PHP LAN traffic. Do not forward it to the public internet without adding authentication and transport protection.

## API endpoints

- `POST api/sensor.php` validates all four numeric readings and inserts them into `sensor_data`.
- `GET api/latest.php` returns the newest reading or `data: null` when there is none.
- `GET api/history.php?range=1h|6h|24h` returns timestamped rows for charts (up to 1000 rows).

Temperature, humidity, and non-negative value checks are performed by the ingest endpoint. MQ thresholds are raw-value thresholds, not ppm. Moisture is stored and displayed as sent by the ESP; no unit or scale is assumed. Starter alert thresholds are in `assets/js/dashboard.js` under `THRESHOLDS` and should be calibrated for the food and sensor arrangement.

## Notes

- There is no demo dataset: charts and cards remain empty until sensor data arrives.
- Chart.js and the selected fonts load from public CDNs, so those visual dependencies need internet access. Data API calls stay on the local PHP server.
- Dashboard status thresholds are starter values, not food-safety certification. Choose and validate thresholds for the monitored food and device.