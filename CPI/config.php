<?php
/**
 * Database configuration – edit here to switch between local and cloud MySQL.
 * For production: use environment variables or a secret config file (do not commit credentials).
 */

// --- Local development (XAMPP / MAMP / WAMP) ---
$dbHost = 'localhost';
$dbName = 'edge_db';
$dbUser = 'root';
$dbPass = '';

// --- Cloud MySQL (uncomment and set when deploying) ---
// $dbHost = 'your-db-host.example.com';  // e.g. from AWS RDS, PlanetScale, etc.
// $dbName = 'edge_db';
// $dbUser = 'your_db_user';
// $dbPass = 'your_db_password';

$dsn = "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4";
