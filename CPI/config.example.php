<?php
/**
 * Database configuration – copy to config.php and fill in your values.
 * Do NOT commit config.php (it contains secrets).
 */

$dbHost = 'your-db-host.pooler.supabase.com';
$dbName = 'postgres';
$dbUser = 'postgres.your_project_ref';
$dbPass = 'YOUR_DATABASE_PASSWORD';
$dbPort = '6543';

$dsn = "pgsql:host=$dbHost;port=$dbPort;dbname=$dbName";

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    die("Cloud database connection failed: " . $e->getMessage());
}
