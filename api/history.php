<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/supabase.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$ranges = ['1h' => 1, '6h' => 6, '24h' => 24];
$range = $_GET['range'] ?? '6h';
if (!isset($ranges[$range])) {
    send_json(['success' => false, 'message' => 'Range must be 1h, 6h, or 24h.'], 400);
}

$since = gmdate('c', time() - ($ranges[$range] * 3600));
$query = http_build_query([
    'select' => 'id,temperature,humidity,mq_value,moisture,created_at',
    'created_at' => 'gte.' . $since,
    'order' => 'created_at.asc',
    'limit' => '1000',
]);
$result = supabase_request('GET', 'sensor_data?' . $query);
if (!$result['ok']) {
    error_log('FoodGuard history read failed: ' . (string) $result['error']);
    send_json(['success' => false, 'api_status' => 'connected', 'database_status' => 'error', 'message' => 'Unable to read sensor history.'], 502);
}

send_json([
    'success' => true,
    'api_status' => 'connected',
    'database_status' => 'connected',
    'data' => is_array($result['data']) ? $result['data'] : [],
]);