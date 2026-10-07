<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/supabase.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$result = supabase_request('GET', 'sensor_data?select=id,temperature,humidity,mq_value,moisture,created_at&order=created_at.desc&limit=1');
if (!$result['ok']) {
    error_log('FoodGuard latest read failed: ' . (string) $result['error']);
    send_json(['success' => false, 'api_status' => 'connected', 'database_status' => 'error', 'message' => 'Unable to read sensor data.'], 502);
}

$rows = is_array($result['data']) ? $result['data'] : [];
send_json([
    'success' => true,
    'api_status' => 'connected',
    'database_status' => 'connected',
    'data' => $rows[0] ?? null,
]);