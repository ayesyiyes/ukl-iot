<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/supabase.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

// Support both ESP form posts and JSON requests.
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$input = str_contains($contentType, 'application/json')
    ? json_decode(file_get_contents('php://input'), true)
    : $_POST;

if (!is_array($input)) {
    send_json(['success' => false, 'message' => 'Request body must contain valid sensor data.'], 400);
}

$fields = ['temperature', 'humidity', 'mq_value', 'moisture'];
$values = [];
foreach ($fields as $field) {
    if (!isset($input[$field]) || !is_numeric($input[$field]) || !is_finite((float) $input[$field])) {
        send_json(['success' => false, 'message' => 'Missing or invalid sensor field: ' . $field], 400);
    }
    $values[$field] = (float) $input[$field];
}

if ($values['temperature'] < -50 || $values['temperature'] > 100) {
    send_json(['success' => false, 'message' => 'Temperature is outside the accepted range.'], 400);
}
if ($values['humidity'] < 0 || $values['humidity'] > 100) {
    send_json(['success' => false, 'message' => 'Humidity must be between 0 and 100.'], 400);
}
if ($values['mq_value'] < 0 || $values['moisture'] < 0) {
    send_json(['success' => false, 'message' => 'MQ value and moisture must not be negative.'], 400);
}

$result = supabase_request('POST', 'sensor_data?select=id,created_at', $values, 'return=representation');
if (!$result['ok']) {
    error_log('FoodGuard sensor insert failed: ' . (string) $result['error']);
    send_json(['success' => false, 'message' => 'Failed to save sensor data.'], 502);
}

send_json(['success' => true, 'message' => 'Sensor data saved successfully.']);