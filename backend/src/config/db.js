const { Pool } = require('pg');
require('dotenv').config();

// Check if PostgreSQL configuration is provided
const isPostgresConfigured = Boolean(process.env.DB_HOST);

let pool = null;
let dbType = 'none';

// In-memory fallback database for local testing when RDS/Postgres is not yet connected
let inMemoryStore = [
  {
    id: 1,
    student_name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 9876543210',
    dob: '2004-05-15',
    gender: 'Male',
    course: 'B.Tech - Computer Science',
    qualification: '12th Science',
    percentage: '88.5%',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: '402, Green Park, Andheri West',
    status: 'Approved',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 2,
    student_name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+91 9812345678',
    dob: '2003-08-22',
    gender: 'Female',
    course: 'B.Tech - Artificial Intelligence & ML',
    qualification: '12th Science',
    percentage: '92.4%',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Flat 12, Sunrise Residency, Baner',
    status: 'Under Review',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 3,
    student_name: 'Amit Kumar Verma',
    email: 'amit.verma@example.com',
    phone: '+91 9765432109',
    dob: '2002-11-10',
    gender: 'Male',
    course: 'MCA - Master of Computer Applications',
    qualification: 'BCA',
    percentage: '84.0%',
    city: 'Delhi',
    state: 'Delhi NCR',
    address: 'H-24, Sector 15, Rohini',
    status: 'Submitted',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 4,
    student_name: 'Ananya Sen',
    email: 'ananya.sen@example.com',
    phone: '+91 9123456780',
    dob: '2004-01-30',
    gender: 'Female',
    course: 'B.Tech - Data Science',
    qualification: '12th Science',
    percentage: '89.2%',
    city: 'Kolkata',
    state: 'West Bengal',
    address: '15/A Park Circus, Kolkata',
    status: 'Approved',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];
let nextInMemoryId = 5;

if (isPostgresConfigured) {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'threetierdb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10
  });

  dbType = 'PostgreSQL (AWS RDS / Remote)';

  // Test initial connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.warn('⚠️ Warning: Could not connect to PostgreSQL RDS. Will use in-memory store as fallback until DB is online:', err.message);
    } else {
      console.log('✅ Connected successfully to PostgreSQL Data Tier at:', process.env.DB_HOST);
      initPostgresSchema();
    }
  });
} else {
  dbType = 'Local In-Memory Mode (Set DB_HOST for AWS RDS)';
  console.log('ℹ️ Running in Local Mock Mode. Set DB_HOST in .env to connect to AWS RDS PostgreSQL.');
}

async function initPostgresSchema() {
  if (!pool) return;
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS admissions (
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
  `;
  try {
    await pool.query(createTableQuery);
    // Check if empty, insert seed data
    const countRes = await pool.query('SELECT COUNT(*) FROM admissions');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO admissions (student_name, email, phone, dob, gender, course, qualification, percentage, city, state, address, status) VALUES
        ('Rahul Sharma', 'rahul.sharma@example.com', '+91 9876543210', '2004-05-15', 'Male', 'B.Tech - Computer Science', '12th Science', '88.5%', 'Mumbai', 'Maharashtra', '402, Green Park, Andheri West', 'Approved'),
        ('Priya Patel', 'priya.patel@example.com', '+91 9812345678', '2003-08-22', 'Female', 'B.Tech - Artificial Intelligence & ML', '12th Science', '92.4%', 'Pune', 'Maharashtra', 'Flat 12, Sunrise Residency, Baner', 'Under Review'),
        ('Amit Kumar Verma', 'amit.verma@example.com', '+91 9765432109', '2002-11-10', 'Male', 'MCA - Master of Computer Applications', 'BCA', '84.0%', 'Delhi', 'Delhi NCR', 'H-24, Sector 15, Rohini', 'Submitted'),
        ('Ananya Sen', 'ananya.sen@example.com', '+91 9123456780', '2004-01-30', 'Female', 'B.Tech - Data Science', '12th Science', '89.2%', 'Kolkata', 'West Bengal', '15/A Park Circus, Kolkata', 'Approved');
      `);
      console.log('✅ Seed admission records inserted into PostgreSQL database.');
    }
  } catch (err) {
    console.error('Error initializing PostgreSQL admissions schema:', err.message);
  }
}

// Unified Query interface
async function query(text, params = []) {
  const startTime = Date.now();
  
  if (pool) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - startTime;
      return { rows: res.rows, rowCount: res.rowCount, duration, source: 'PostgreSQL RDS (Tier 3)' };
    } catch (err) {
      console.error('PostgreSQL query error, falling back to local simulation:', err.message);
    }
  }

  // Fallback in-memory query simulator for local testing
  const duration = Date.now() - startTime;
  
  if (text.includes('SELECT * FROM admissions') || text.includes('SELECT * FROM records')) {
    return { rows: [...inMemoryStore].reverse(), rowCount: inMemoryStore.length, duration, source: 'Local Memory (No DB Host)' };
  }
  
  if (text.includes('SELECT COUNT(*)')) {
    return { rows: [{ count: inMemoryStore.length }], rowCount: 1, duration, source: 'Local Memory (No DB Host)' };
  }
  
  return { rows: [], rowCount: 0, duration, source: 'Local Memory' };
}

// Create Admission
async function createAdmission({
  student_name,
  email,
  phone,
  dob,
  gender,
  course,
  qualification,
  percentage,
  city,
  state,
  address,
  status
}) {
  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO admissions 
         (student_name, email, phone, dob, gender, course, qualification, percentage, city, state, address, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
         RETURNING *`,
        [
          student_name,
          email,
          phone,
          dob || null,
          gender || 'Not Specified',
          course,
          qualification,
          percentage,
          city || '',
          state || '',
          address || '',
          status || 'Submitted'
        ]
      );
      return res.rows[0];
    } catch (err) {
      console.error('PostgreSQL admission insert error, using local fallback:', err.message);
    }
  }

  const newAdmission = {
    id: nextInMemoryId++,
    student_name,
    email,
    phone,
    dob: dob || '',
    gender: gender || 'Not Specified',
    course,
    qualification,
    percentage,
    city: city || '',
    state: state || '',
    address: address || '',
    status: status || 'Submitted',
    created_at: new Date().toISOString()
  };
  inMemoryStore.push(newAdmission);
  return newAdmission;
}

// Update Admission Status
async function updateAdmissionStatus(id, status) {
  const admissionId = parseInt(id, 10);
  if (pool) {
    try {
      const res = await pool.query(
        'UPDATE admissions SET status = $1 WHERE id = $2 RETURNING *',
        [status, admissionId]
      );
      return res.rows[0] || null;
    } catch (err) {
      console.error('PostgreSQL update error:', err.message);
    }
  }

  const item = inMemoryStore.find(r => r.id === admissionId);
  if (item) {
    item.status = status;
    return item;
  }
  return null;
}

// Delete Admission
async function deleteAdmission(id) {
  const admissionId = parseInt(id, 10);
  if (pool) {
    try {
      const res = await pool.query('DELETE FROM admissions WHERE id = $1 RETURNING *', [admissionId]);
      return res.rowCount > 0;
    } catch (err) {
      console.error('PostgreSQL delete error:', err.message);
    }
  }

  const prevLen = inMemoryStore.length;
  inMemoryStore = inMemoryStore.filter(r => r.id !== admissionId);
  return inMemoryStore.length < prevLen;
}

// Legacy aliases for backward compatibility
const createRecord = (data) => {
  return createAdmission({
    student_name: data.title || 'Unknown Student',
    email: 'user@example.com',
    phone: 'N/A',
    course: data.category || 'General',
    qualification: data.tier || 'Degree',
    percentage: '80%',
    address: data.description || '',
    status: data.status || 'Submitted'
  });
};

const deleteRecord = deleteAdmission;

async function getHealthStatus() {
  const dbConfigured = Boolean(process.env.DB_HOST);
  let dbConnected = false;
  let latencyMs = 0;
  let details = {};

  if (pool) {
    const start = Date.now();
    try {
      const res = await pool.query('SELECT NOW() as current_time, version() as version');
      latencyMs = Date.now() - start;
      dbConnected = true;
      details = {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME || 'threetierdb',
        serverTime: res.rows[0].current_time,
        version: res.rows[0].version
      };
    } catch (err) {
      dbConnected = false;
      details = {
        error: err.message,
        targetHost: process.env.DB_HOST
      };
    }
  }

  return {
    tier1_frontend: 'Operational',
    tier2_backend: {
      status: 'Healthy',
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      serverIp: process.env.SERVER_IP || 'Internal VPC Private IP (10.0.10.x)'
    },
    tier3_database: {
      configured: dbConfigured,
      connected: dbConnected,
      mode: dbConnected ? 'AWS RDS PostgreSQL (Isolated Tier)' : (dbConfigured ? 'Connecting / Unreachable' : 'Local Standalone Mode'),
      latencyMs: dbConnected ? `${latencyMs}ms` : 'N/A',
      details
    }
  };
}

module.exports = {
  query,
  createAdmission,
  updateAdmissionStatus,
  deleteAdmission,
  createRecord,
  deleteRecord,
  getHealthStatus,
  pool,
  dbType
};
