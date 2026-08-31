const db = require('../config/db');

// GET /api/admissions - Fetch all admission applications from Database Tier
exports.getAdmissions = async (req, res) => {
  try {
    const { course, search } = req.query;
    let sql = 'SELECT * FROM admissions ORDER BY id DESC';
    let params = [];

    const result = await db.query(sql, params);
    let data = result.rows;

    if (course && course !== 'all') {
      data = data.filter(item => item.course && item.course.toLowerCase().includes(course.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(item => 
        (item.student_name && item.student_name.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: data.length,
      totalInDatabase: result.rowCount,
      queryDurationMs: result.duration,
      dataSource: result.source,
      data: data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/admissions - Submit new admission form to Database Tier
exports.createAdmission = async (req, res) => {
  try {
    const {
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
    } = req.body;

    if (!student_name || !email || !phone || !course || !qualification || !percentage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory fields: Student Name, Email, Phone, Course, Qualification, and Percentage.'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const newRecord = await db.createAdmission({
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
      status: status || 'Submitted'
    });

    res.status(201).json({
      success: true,
      message: `Admission application successfully submitted for ${student_name}! Stored in Database Tier.`,
      data: newRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/admissions/:id/status - Update application status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updated = await db.updateAdmissionStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Admission application not found' });
    }

    res.json({
      success: true,
      message: `Application #${id} status updated to '${status}'`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/admissions/:id - Delete an application from database
exports.deleteAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteAdmission(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Admission application not found' });
    }
    res.json({ success: true, message: `Application #${id} deleted from database` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Legacy support for /api/records endpoints
exports.getRecords = exports.getAdmissions;
exports.createRecord = exports.createAdmission;
exports.deleteRecord = exports.deleteAdmission;
