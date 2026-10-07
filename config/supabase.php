<?php
declare(strict_types=1);

// Prefer environment variables. The fallback values are for local XAMPP setup only.
define('SUPABASE_URL', rtrim(getenv('SUPABASE_URL') ?: 'https://YOUR-PROJECT.supabase.co', '/'));
define('SUPABASE_KEY', getenv('SUPABASE_KEY') ?: 'YOUR_SERVER_SIDE_SUPABASE_KEY');

function supabase_is_configured(): bool
{
    return SUPABASE_URL !== 'https://YOUR-PROJECT.supabase.co'
        && SUPABASE_KEY !== 'YOUR_SERVER_SIDE_SUPABASE_KEY';
}

function supabase_request(string $method, string $resource, ?array $payload = null, ?string $prefer = null): array
{
    if (!supabase_is_configured()) {
        return ['ok' => false, 'status' => 0, 'data' => null, 'error' => 'Supabase is not configured.'];
    }

    if (!function_exists('curl_init')) {
        return ['ok' => false, 'status' => 0, 'data' => null, 'error' => 'PHP cURL extension is not enabled.'];
    }

    $headers = [
        'apikey: ' . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
        'Accept: application/json',
    ];
    if ($payload !== null) {
        $headers[] = 'Content-Type: application/json';
    }
    if ($prefer !== null) {
        $headers[] = 'Prefer: ' . $prefer;
    }

    $curl = curl_init(SUPABASE_URL . '/rest/v1/' . ltrim($resource, '/'));
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
    ]);
    if ($payload !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload, JSON_THROW_ON_ERROR));
    }

    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($body === false) {
        return ['ok' => false, 'status' => $status, 'data' => null, 'error' => $curlError];
    }

    $decoded = $body === '' ? null : json_decode($body, true);
    $ok = $status >= 200 && $status < 300;
    return [
        'ok' => $ok,
        'status' => $status,
        'data' => $decoded,
        'error' => $ok ? null : (is_array($decoded) ? ($decoded['message'] ?? 'Supabase request failed.') : 'Supabase request failed.'),
    ];
}

function send_json(array $body, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}