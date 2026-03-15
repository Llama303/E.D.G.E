<?php
/**
 * Returns the logged-in user's reference face image (from CPI signup) for face verification.
 * Requires: Authorization: Bearer <Supabase access_token>
 */
require_once __DIR__ . '/config.php';

$sendJson = function ($code, $body) {
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode($body);
    exit;
};

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
    $sendJson(401, ['error' => 'Missing or invalid Authorization header']);
}
$accessToken = trim($m[1]);

// Verify token with Supabase and get user email
$ch = curl_init($supabaseUrl . '/auth/v1/user?apikey=' . urlencode($supabaseAnonKey));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $accessToken,
        'apikey: ' . $supabaseAnonKey,
    ],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    $sendJson(401, ['error' => 'Invalid or expired session']);
}

$user = json_decode($response, true);
$email = $user['email'] ?? null;
if (!$email) {
    $sendJson(401, ['error' => 'User email not found']);
}

// Look up CPI submission by email (most recent)
$stmt = $pdo->prepare("SELECT biometric_file_path FROM cpi_submissions WHERE email = ? ORDER BY created_at DESC LIMIT 1");
$stmt->execute([$email]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row['biometric_file_path'])) {
    $sendJson(404, ['error' => 'No reference face on file. Complete CPI signup first.']);
}

$path = __DIR__ . '/' . $row['biometric_file_path'];
if (!is_file($path)) {
    $sendJson(404, ['error' => 'Reference image file not found']);
}

// Return image
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$mime = $ext === 'png' ? 'image/png' : 'image/jpeg';
header('Content-Type: ' . $mime);
header('Cache-Control: private, max-age=60');
readfile($path);
exit;
