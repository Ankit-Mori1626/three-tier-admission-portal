const db = require('../config/db');
const os = require('os');

// GET /api/health - Quick Liveness probe
exports.getHealth = async (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Three-Tier Backend API (Tier 2)'
  });
};

// GET /api/system/tier-status - 3-Tier Architecture Health & Diagnostics
exports.getTierStatus = async (req, res) => {
  try {
    const health = await db.getHealthStatus();
    
    const architectureInfo = {
      vpc: {
        cidr: '10.0.0.0/16',
        name: 'three-tier-production-vpc',
        region: process.env.AWS_REGION || 'ap-south-1 (Mumbai)'
      },
      tier1_presentation: {
        name: 'Tier 1 - Presentation Layer',
        type: 'Public Subnet (10.0.1.0/24 & 10.0.2.0/24)',
        components: ['Application Load Balancer (ALB)', 'CloudFront / S3 / Nginx UI'],
        status: 'Active',
        securityGroup: 'sg-public-alb (Inbound: 80/443 from 0.0.0.0/0)'
      },
      tier2_application: {
        name: 'Tier 2 - Application Layer',
        type: 'Private App Subnet (10.0.10.0/24 & 10.0.11.0/24)',
        components: ['Node.js Express REST API', 'EC2 Auto Scaling / ECS Fargate'],
        status: health.tier2_backend.status,
        serverUptime: `${health.tier2_backend.uptimeSeconds}s`,
        hostHostname: os.hostname(),
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        securityGroup: 'sg-private-app (Inbound: 5000 ONLY from sg-public-alb, Outbound: NAT GW)'
      },
      tier3_database: {
        name: 'Tier 3 - Data Layer (Isolated)',
        type: 'Isolated DB Subnet (10.0.20.0/24 & 10.0.21.0/24)',
        components: ['AWS RDS PostgreSQL Multi-AZ'],
        status: health.tier3_database.connected ? 'Connected & Healthy' : (health.tier3_database.configured ? 'Connecting / Unreachable' : 'Local Fallback Active'),
        isIsolated: true,
        internetAccess: 'NO (0.0.0.0/0 Route NOT configured)',
        dbMode: health.tier3_database.mode,
        queryLatency: health.tier3_database.latencyMs,
        details: health.tier3_database.details,
        securityGroup: 'sg-isolated-db (Inbound: 5432 ONLY from sg-private-app, Outbound: None)'
      }
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      architecture: architectureInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/system/test-query - Test query execution speed on Database Tier
exports.testQuery = async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await db.query('SELECT 1 + 1 AS solution, NOW() AS db_time');
    const elapsed = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Direct Tier 3 Database query executed',
      queryTimeMs: elapsed,
      result: result.rows,
      source: result.source
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
