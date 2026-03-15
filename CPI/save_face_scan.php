<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    die('Database connection failed.');
}

function redirect_with_message($msg, $type = 'error') {
    header("Location: CPI.html?$type=" . urlencode($msg));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['submit_cpi'])) {
    redirect_with_message('Invalid request.');
}

// ... (Keep all your existing POST variable sanitization and validation here) ...

$biometric_type = $_POST['biometric_type'] ?? '';
$biometric_file_path = '';
$uploadDir = __DIR__ . '/uploads';

// Handle Biometric Data
if ($biometric_type === 'face_scan' && !empty($_POST['face_scan_data'])) {
    // Process Base64 Camera Capture
    $data = $_POST['face_scan_data'];
    if (preg_match('/^data:image\/(\w+);base64,/', $data, $type)) {
        $data = base64_decode(substr($data, strpos($data, ',') + 1));
        $fileName = 'face_scan_' . time() . '_' . bin2hex(random_bytes(4)) . '.jpg';
        file_put_contents($uploadDir . '/' . $fileName, $data);
        $biometric_file_path = 'uploads/' . $fileName;
    }
} else {
    // Process Standard File Upload (Photo/Fingerprint)
    $biometric_file_path = save_upload('biometric_file', ['image/jpeg', 'image/png'], $uploadDir);
}

// Save all other files (ID, Proof of Address)
$gov_id_file_path = save_upload('gov_id_file', ['image/jpeg', 'image/png', 'application/pdf'], $uploadDir);
$proof_of_address_path = save_upload('proof_of_address', ['image/jpeg', 'image/png', 'application/pdf'], $uploadDir);

// Insert into Database
$stmt = $pdo->prepare("
    INSERT INTO cpi_submissions (
        full_name, email, phone, dob, gov_id_type, gov_id_number,
        gov_id_file_path, proof_of_address_path, employment_status,
        occupation, employer_name, income_sources, account_purpose,
        transaction_nature, biometric_type, biometric_file_path
    ) VALUES (
        :full_name, :email, :phone, :dob, :gov_id_type, :gov_id_number,
        :gov_id_file_path, :proof_of_address_path, :employment_status,
        :occupation, :employer_name, :income_sources, :account_purpose,
        :transaction_nature, :biometric_type, :biometric_file_path
    )
");

$stmt->execute([
    ':full_name' => $full_name,
    ':email' => $email,
    ':phone' => $phone,
    ':dob' => $dob,
    ':gov_id_type' => $gov_id_type,
    ':gov_id_number' => $gov_id_number,
    ':gov_id_file_path' => $gov_id_file_path,
    ':proof_of_address_path' => $proof_of_address_path,
    ':employment_status' => $employment_status,
    ':occupation' => $occupation ?: null,
    ':employer_name' => $employer_name ?: null,
    ':income_sources' => $income_sources,
    ':account_purpose' => $account_purpose,
    ':transaction_nature' => $transaction_nature,
    ':biometric_type' => $biometric_type,
    ':biometric_file_path' => $biometric_file_path
]);

redirect_with_message('Registration completed successfully.', 'success');