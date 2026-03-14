-- E.D.G.E – CPI submissions database schema
-- Run this in phpMyAdmin (SQL tab) or: mysql -u root -p edge_db < schema.sql

CREATE DATABASE IF NOT EXISTS edge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edge_db;

CREATE TABLE IF NOT EXISTS cpi_submissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    dob DATE NOT NULL,
    gov_id_type VARCHAR(50) NOT NULL,
    gov_id_number VARCHAR(100) NOT NULL,
    gov_id_file_path VARCHAR(255) NOT NULL,
    proof_of_address_path VARCHAR(255) NOT NULL,
    employment_status VARCHAR(50) NOT NULL,
    occupation VARCHAR(255) NULL,
    employer_name VARCHAR(255) NULL,
    income_sources TEXT NOT NULL,
    account_purpose TEXT NOT NULL,
    transaction_nature TEXT NOT NULL,
    selfie_photo_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
