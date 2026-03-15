<?php
/**
 * E.D.G.E – CPI form handler
 * Optimized to handle both Manual Biometric Uploads and AI Face Map Capture.
 */

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (PDOException $e) {
    die('Database connection failed.');
}

function redirect_with_message($msg, $type = 'error') {
    $location = 'CPI.html?' . $type . '=' . urlencode($msg);
    header("Location: $location");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['submit_cpi'])) {
    redirect_with_message('Invalid request.');
}

if (empty($_POST['agree_terms']) || $_POST['agree_terms'] !== '1') {
    redirect_with_message('You must read and agree to the Terms and Conditions to continue.');
}

// --- 1. CAPTURE FORM DATA ---
$full_name          = trim($_POST['full_name'] ?? '');
$email              = trim($_POST['email'] ?? '');
$phone              = trim($_POST['phone'] ?? '');
$dob                = $_POST['dob'] ?? '';
$gov_id_type        = $_POST['gov_id_type'] ?? '';
$gov_id_number      = trim($_POST['gov_id_number'] ?? '');
$employment_status  = $_POST['employment_status'] ?? '';
$occupation         = trim($_POST['occupation'] ?? '');
$employer_name      = trim($_POST['employer_name'] ?? '');
$income_sources     = trim($_POST['income_sources'] ?? '');
$account_purpose    = trim($_POST['account_purpose'] ?? '');
$transaction_nature = trim($_POST['transaction_nature'] ?? '');
$biometric_type     = $_POST['biometric_type'] ?? '';
$face_descriptor    = $_POST['face_descriptor'] ?? null; // The AI captured data

// --- 2. VALIDATION ---
if ($full_name === '' || strlen($full_name) < 2) redirect_with_message('Please enter your full name.');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) redirect_with_message('Please enter a valid email address.');
if ($dob === '') redirect_with_message('Please provide your date of birth.');
if ($gov_id_type === '') redirect_with_message('Please select a government ID type.');
if ($employment_status === '') redirect_with_message('Please select your employment status.');

// --- 3. FILE UPLOAD UTILITY ---
$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

function save_upload($key, $allowedTypes, $uploadDir) {
    if (!isset($_FILES[$key]) || $_FILES[$key]['error'] !== UPLOAD_ERR_OK) {
        return null; // Return null if file is optional or missing
    }

    $tmpName = $_FILES[$key]['tmp_name'];
    $name    = basename($_FILES[$key]['name']);
    $type    = mime_content_type($tmpName);

    if (!in_array($type, $allowedTypes, true)) {
        redirect_with_message('Invalid file type for ' . $key);
    }

    $ext = pathinfo($name, PATHINFO_EXTENSION);
    $newName = $key . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destPath = $uploadDir . '/' . $newName;

    if (!move_uploaded_file($tmpName, $destPath)) {
        redirect_with_message('Failed to save uploaded file: ' . $key);
    }

    return 'uploads/' . $newName;
}

// --- 4. PROCESS UPLOADS ---

// Mandatory IDs
$gov_id_file_path = save_upload('gov_id_file', ['image/jpeg', 'image/png', 'application/pdf'], $uploadDir);
if (!$gov_id_file_path) redirect_with_message('Please upload your government ID.');

$proof_of_address_path = save_upload('proof_of_address', ['image/jpeg', 'image/png', 'application/pdf'], $uploadDir);
if (!$proof_of_address_path) redirect_with_message('Please upload proof of address.');

// Conditional Biometrics
$biometric_file_path = null;

if ($biometric_type === 'face') {
    // If using AI, we MUST have the face_descriptor string
    if (empty($face_descriptor)) {
        redirect_with_message('Face scan data missing. Please capture your face map.');
    }
} else {
    // If using Fingerprint/Manual, we MUST have a file upload
    $biometric_file_path = save_upload('biometric_file', ['image/jpeg', 'image/png'], $uploadDir);
    if (!$biometric_file_path) {
        redirect_with_message('Please upload your biometric verification file.');
    }
}

// --- 5. DATABASE INSERT ---
$stmt = $pdo->prepare("
    INSERT INTO cpi_submissions (
        full_name, email, phone, dob,
        gov_id_type, gov_id_number,
        gov_id_file_path, proof_of_address_path,
        employment_status, occupation, employer_name,
        income_sources, account_purpose, transaction_nature,
        biometric_type, biometric_file_path, face_descriptor
    ) VALUES (
        :full_name, :email, :phone, :dob,
        :gov_id_type, :gov_id_number,
        :gov_id_file_path, :proof_of_address_path,
        :employment_status, :occupation, :employer_name,
        :income_sources, :account_purpose, :transaction_nature,
        :biometric_type, :biometric_file_path, :face_descriptor
    )
");

$stmt->execute([
    ':full_name'              => $full_name,
    ':email'                  => $email,
    ':phone'                  => $phone,
    ':dob'                    => $dob,
    ':gov_id_type'            => $gov_id_type,
    ':gov_id_number'          => $gov_id_number,
    ':gov_id_file_path'       => $gov_id_file_path,
    ':proof_of_address_path'  => $proof_of_address_path,
    ':employment_status'      => $employment_status,
    ':occupation'             => $occupation ?: null,
    ':employer_name'          => $employer_name ?: null,
    ':income_sources'         => $income_sources,
    ':account_purpose'        => $account_purpose,
    ':transaction_nature'     => $transaction_nature,
    ':biometric_type'         => $biometric_type,
    ':biometric_file_path'    => $biometric_file_path,
    ':face_descriptor'        => $face_descriptor 
]);

redirect_with_message('Information submitted successfully.', 'success');