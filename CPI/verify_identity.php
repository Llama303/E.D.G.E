<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) { die('Connection failed.'); }

function fail($msg) {
    header("Location: CPI.html?error=" . urlencode($msg));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Invalid request.');

// 1. DATA VALIDATION (Log-in/Identity Information)
$full_name = trim($_POST['full_name'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$dob = $_POST['dob'] ?? '';

if (!$full_name || !$email || !$dob) fail('Please complete all identity fields.');

// 2. FILE HANDLING
$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);

function process_upload($key, $dir) {
    if (!isset($_FILES[$key]) || $_FILES[$key]['error'] !== UPLOAD_ERR_OK) return null;
    $ext = pathinfo($_FILES[$key]['name'], PATHINFO_EXTENSION);
    $path = 'uploads/' . $key . '_' . time() . '.' . $ext;
    move_uploaded_file($_FILES[$key]['tmp_name'], __DIR__ . '/' . $path);
    return $path;
}

$gov_id_path = process_upload('gov_id_file', $uploadDir);
$address_path = process_upload('proof_of_address', $uploadDir);

if (!$gov_id_path || !$address_path) fail('ID and Proof of Address files are required.');

// 3. BIOMETRIC HANDLING (Face Scan vs. Upload)
$biometric_type = $_POST['biometric_type'] ?? '';
$biometric_path = '';

if ($biometric_type === 'face_scan') {
    $data = $_POST['face_scan_data'] ?? '';
    if (strpos($data, 'data:image/jpeg;base64,') === 0) {
        $data = base64_decode(str_replace('data:image/jpeg;base64,', '', $data));
        $biometric_path = 'uploads/face_' . time() . '.jpg';
        file_put_contents(__DIR__ . '/' . $biometric_path, $data);
    }
} else {
    $biometric_path = process_upload('biometric_file', $uploadDir);
}

if (!$biometric_path) fail('Biometric verification is incomplete.');

// 4. DATABASE INSERTION
$stmt = $pdo->prepare("INSERT INTO cpi_submissions (full_name, email, phone, dob, gov_id_type, gov_id_number, gov_id_file_path, proof_of_address_path, employment_status, occupation, employer_name, income_sources, account_purpose, transaction_nature, biometric_type, biometric_file_path) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$stmt->execute([
    $full_name, $email, $_POST['phone'], $dob, $_POST['gov_id_type'], $_POST['gov_id_number'],
    $gov_id_path, $address_path, $_POST['employment_status'], $_POST['occupation'],
    $_POST['employer_name'], $_POST['income_sources'], $_POST['account_purpose'], 
    $_POST['transaction_nature'], $biometric_type, $biometric_path
]);

header("Location: CPI.html?success=" . urlencode("Registration Successful"));