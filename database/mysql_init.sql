-- =========================================================
-- AWS 3-TIER ARCHITECTURE: TIER 3 DATA LAYER SCHEMA (MySQL)
-- =========================================================

CREATE DATABASE IF NOT EXISTS threetierdb;
USE threetierdb;

DROP TABLE IF EXISTS records;

CREATE TABLE records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    tier VARCHAR(100) DEFAULT 'Tier 2 - App Layer',
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO records (title, category, description, tier, status) VALUES
('Custom AWS VPC Created', 'Networking', 'VPC with 10.0.0.0/16 CIDR and 6 Subnets across 2 AZs', 'Tier 1 - Public & Private', 'Completed'),
('Tier 2 Node.js Backend Deployed', 'Compute', 'Running on EC2 inside Private Subnet 10.0.10.0/24', 'Tier 2 - App Layer', 'Completed'),
('AWS RDS MySQL Launched', 'Database', 'Provisioned in Isolated DB Subnet (10.0.20.0/24)', 'Tier 3 - Data Layer', 'Completed');

SELECT * FROM records;
