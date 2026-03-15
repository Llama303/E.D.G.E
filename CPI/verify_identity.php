<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

function fail($msg) {
    header("Location: CPI.html?error=" . urlencode($msg));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Invalid request method.');

// 1. COLLECT & SANITIZE TEXT DATA
$full_name      = trim($_POST['full_name'] ?? '');
$email          = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$phone          = trim($_POST['phone'] ?? '');
$dob            = $_POST['dob'] ?? '';
$gov_id_type    = $_POST['gov_id_type'] ?? '';
$gov_id_number  = trim($_POST['gov_id_number'] ?? '');
$emp_status     = $_POST['employment_status'] ?? '';
$occupation     = $_POST['occupation'] ?? null;
$employer       = $_POST['employer_name'] ?? null;
$income         = $_POST['income_sources'] ?? '';
$purpose        = $_POST['account_purpose'] ?? '';
$nature         = $_POST['transaction_nature'] ?? '';
$biometric_type = $_POST['biometric_type'] ?? '';

// 2. DIRECTORY SETUP
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

// Helper function for standard file uploads
function handle_file_upload($key, $uploadDir) {
    if (!isset($_FILES[$key]) || $_FILES[$key]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    $fileName = time() . '_' . basename($_FILES[$key]['name']);
    $targetPath = $uploadDir . $fileName;
    if (move_uploaded_file($_FILES[$key]['tmp_name'], $targetPath)) {
        return 'uploads/' . $fileName;
    }
    return null;
}

// 3. PROCESS UPLOADS
$gov_id_path = handle_file_upload('gov_id_file', $uploadDir);
$address_path = handle_file_upload('proof_of_address', $uploadDir);

// 4. PROCESS BIOMETRICS (The "Live Scan" vs "File" logic)
$biometric_path = null;

if ($biometric_type === 'face_scan') {
    $base64Data = $_POST['face_scan_data'] ?? '';
    if (!empty($base64Data)) {
        // Remove the "data:image/jpeg;base64," part
        $data = str_replace('data:image/jpeg;base64,', '', $base64Data);
        $data = str_replace(' ', '+', $data);
        $decodedData = base64_decode($data);
        $fileName = 'face_capture_' . time() . '.jpg';
        file_put_contents($uploadDir . $fileName, $decodedData);
        $biometric_path = 'uploads/' . $fileName;
    }
} else {
    $biometric_path = handle_file_upload('biometric_file', $uploadDir);
}

// Check if critical items are missing
if (!$gov_id_path) fail("Government ID file is missing or failed to upload.");
if (!$biometric_path) fail("Biometric verification (Scan or File) is missing.");

// 5. DATABASE INSERT
try {
    $sql = "INSERT INTO cpi_submissions (
        full_name, email, phone, dob, gov_id_type, gov_id_number, 
        gov_id_file_path, proof_of_address_path, employment_status, 
        occupation, employer_name, income_sources, account_purpose, 
        transaction_nature, biometric_type, biometric_file_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $full_name, $email, $phone, $dob, $gov_id_type, $gov_id_number,
        $gov_id_path, $address_path, $emp_status, $occupation, 
        $employer, $income, $purpose, $nature, $biometric_type, $biometric_path
    ]);

    header("Location: CPI.html?success=" . urlencode("Form submitted and saved successfully!"));
    exit;

} catch (PDOException $e) {
    // This will print the SQL error if the insert fails
    fail("Database Error: " . $e->getMessage());
}