-- =========================================================
-- AWS 3-TIER ARCHITECTURE: TIER 3 DATA LAYER SCHEMA (PostgreSQL)
-- Student Admission Database inside Isolated Subnet
-- =========================================================

-- Drop table if exists for clean re-init
DROP TABLE IF EXISTS admissions;
DROP TABLE IF EXISTS records;

-- Create admissions table
CREATE TABLE admissions (
    id SERIAL PRIMARY KEY,
    student_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    dob DATE,
    gender VARCHAR(20) DEFAULT 'Not Specified',
    course VARCHAR(100) NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    percentage VARCHAR(20) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    address TEXT,
    status VARCHAR(50) DEFAULT 'Submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample admission records
INSERT INTO admissions (student_name, email, phone, dob, gender, course, qualification, percentage, city, state, address, status) VALUES
('Rahul Sharma', 'rahul.sharma@example.com', '+91 9876543210', '2004-05-15', 'Male', 'B.Tech - Computer Science', '12th Science', '88.5%', 'Mumbai', 'Maharashtra', '402, Green Park, Andheri West', 'Approved'),
('Priya Patel', 'priya.patel@example.com', '+91 9812345678', '2003-08-22', 'Female', 'B.Tech - Artificial Intelligence & ML', '12th Science', '92.4%', 'Pune', 'Maharashtra', 'Flat 12, Sunrise Residency, Baner', 'Under Review'),
('Amit Kumar Verma', 'amit.verma@example.com', '+91 9765432109', '2002-11-10', 'Male', 'MCA - Master of Computer Applications', 'BCA', '84.0%', 'Delhi', 'Delhi NCR', 'H-24, Sector 15, Rohini', 'Submitted'),
('Ananya Sen', 'ananya.sen@example.com', '+91 9123456780', '2004-01-30', 'Female', 'B.Tech - Data Science', '12th Science', '89.2%', 'Kolkata', 'West Bengal', '15/A Park Circus, Kolkata', 'Approved');

-- Query verification
SELECT * FROM admissions;
