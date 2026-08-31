const express = require('express');
const router = express.Router();

const recordController = require('../controllers/recordController');
const systemController = require('../controllers/systemController');

// System & Health Endpoints
router.get('/health', systemController.getHealth);
router.get('/system/tier-status', systemController.getTierStatus);
router.get('/system/test-query', systemController.testQuery);

// Admission Resource Endpoints (Tier 2 to Tier 3 communication)
router.get('/admissions', recordController.getAdmissions);
router.post('/admissions', recordController.createAdmission);
router.put('/admissions/:id/status', recordController.updateStatus);
router.delete('/admissions/:id', recordController.deleteAdmission);

// Legacy aliases
router.get('/records', recordController.getRecords);
router.post('/records', recordController.createRecord);
router.delete('/records/:id', recordController.deleteRecord);

module.exports = router;
