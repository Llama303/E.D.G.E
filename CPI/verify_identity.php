<?php
/**
 * E.D.G.E – CPI form handler: validate, store uploads, insert into database.
 * Requires: PHP with PDO MySQL; database and table created (see schema.sql).
 * Database settings: edit CPI/config.php for local vs cloud.
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

if ($full_name === '' || strlen($full_name) < 2) {
    redirect_with_message('Please enter your full name.');
}

if ($email === '') {
    redirect_with_message('Please enter your email address.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_with_message('Please enter a valid email address.');
}

$phoneDigits = preg_replace('/\D/', '', $phone);
if (strlen($phoneDigits) < 7 || strlen($phoneDigits) > 15) {
    redirect_with_message('Please enter a valid phone number (7–15 digits).');
}

if ($dob === '') {
    redirect_with_message('Please provide your date of birth.');
}

if ($gov_id_type === '') {
    redirect_with_message('Please select a government ID type.');
}

if (strlen($gov_id_number) < 3) {
    redirect_with_message('Please enter a valid government ID number.');
}

if ($employment_status === '') {
    redirect_with_message('Please select your employment status.');
}

if (!in_array($employment_status, ['retired', 'unemployed'], true)) {
    if (strlen($occupation) < 2) {
        redirect_with_message('Please enter your occupation.');
    }
    if (strlen($employer_name) < 2) {
        redirect_with_message('Please enter your employer name (or "Self-employed").');
    }
}

if (strlen($income_sources) < 5) {
    redirect_with_message('Please describe your income sources.');
}

if (strlen($account_purpose) < 5) {
    redirect_with_message('Please describe the purpose of opening this account.');
}

if (strlen($transaction_nature) < 5) {
    redirect_with_message('Please describe the expected nature of your transactions.');
}

$biometric_type = $_POST['biometric_type'] ?? '';
$allowed_biometric = ['photo', 'fingerprint', 'face_scan'];
if (!in_array($biometric_type, $allowed_biometric, true)) {
    redirect_with_message('Please select a valid biometric verification method.');
}

if (isset($_POST['biometric_type']) && $_POST['biometric_type'] === 'face_scan') {
    // Handle face scan file + CPI data from localStorage
    // Save both to databases using the migrated biometric schema or whater
}

$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

function save_upload($key, $allowedTypes, $uploadDir) {
    if (!isset($_FILES[$key]) || $_FILES[$key]['error'] !== UPLOAD_ERR_OK) {
        redirect_with_message('Error uploading file: ' . $key);
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

$gov_id_file_path = save_upload('gov_id_file', [
    'image/jpeg', 'image/png', 'application/pdf'
], $uploadDir);

$proof_of_address_path = save_upload('proof_of_address', [
    'image/jpeg', 'image/png', 'application/pdf'
], $uploadDir);

$biometric_file_path = save_upload('biometric_file', [
    'image/jpeg', 'image/png'
], $uploadDir);

$stmt = $pdo->prepare("
    INSERT INTO cpi_submissions (
        full_name, email, phone, dob,
        gov_id_type, gov_id_number,
        gov_id_file_path, proof_of_address_path,
        employment_status, occupation, employer_name,
        income_sources, account_purpose, transaction_nature,
        biometric_type, biometric_file_path
    ) VALUES (
        :full_name, :email, :phone, :dob,
        :gov_id_type, :gov_id_number,
        :gov_id_file_path, :proof_of_address_path,
        :employment_status, :occupation, :employer_name,
        :income_sources, :account_purpose, :transaction_nature,
        :biometric_type, :biometric_file_path
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
    ':occupation'             => $occupation !== '' ? $occupation : null,
    ':employer_name'          => $employer_name !== '' ? $employer_name : null,
    ':income_sources'         => $income_sources,
    ':account_purpose'        => $account_purpose,
    ':transaction_nature'     => $transaction_nature,
    ':biometric_type'         => $biometric_type,
    ':biometric_file_path'    => $biometric_file_path,
]);

redirect_with_message('Information submitted successfully.', 'success');
