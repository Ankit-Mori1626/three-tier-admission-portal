// Dynamic API Base
const API_BASE = window.location.port === '5000' || window.location.port === '' ? '/api' : 'http://localhost:5000/api';

let allAdmissions = [];
let searchQuery = '';

// DOM Elements
const form = document.getElementById('admission-form');
const btnSubmit = document.getElementById('btn-submit');
const btnAutofill = document.getElementById('btn-autofill');
const countDb = document.getElementById('count-db');
const btnViewDatabase = document.getElementById('btn-view-database');

// Modals
const successModal = document.getElementById('success-modal');
const submissionReceipt = document.getElementById('submission-receipt');
const btnSubmitAnother = document.getElementById('btn-submit-another');
const btnViewDbFromModal = document.getElementById('btn-view-db-from-modal');

const recordsModal = document.getElementById('records-modal');
const btnCloseRecords = document.getElementById('btn-close-records');
const btnCloseRecordsBtn = document.getElementById('btn-close-records-btn');
const inputFilterSearch = document.getElementById('input-filter-search');
const modalDbRecords = document.getElementById('modal-db-records');

// Init
document.addEventListener('DOMContentLoaded', () => {
  fetchAdmissions();
  setupEventListeners();
});

function setupEventListeners() {
  // Submit Form
  form.addEventListener('submit', handleAdmissionSubmit);

  // Demo auto-fill
  btnAutofill.addEventListener('click', handleAutoFill);

  // View database records modal
  btnViewDatabase.addEventListener('click', () => {
    openRecordsModal();
  });

  // Modal actions
  btnSubmitAnother.addEventListener('click', () => {
    successModal.classList.add('hidden');
    document.getElementById('student_name').focus();
  });

  btnViewDbFromModal.addEventListener('click', () => {
    successModal.classList.add('hidden');
    openRecordsModal();
  });

  btnCloseRecords.addEventListener('click', () => recordsModal.classList.add('hidden'));
  btnCloseRecordsBtn.addEventListener('click', () => recordsModal.classList.add('hidden'));

  [successModal, recordsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });

  // Filter in modal
  inputFilterSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderModalRecords();
  });
}

function openRecordsModal() {
  recordsModal.classList.remove('hidden');
  inputFilterSearch.value = '';
  searchQuery = '';
  renderModalRecords();
}

// Fetch all applications from DB
async function fetchAdmissions() {
  try {
    const res = await fetch(`${API_BASE}/admissions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (result.success) {
      allAdmissions = result.data || [];
      if (countDb) countDb.textContent = allAdmissions.length;
    }
  } catch (err) {
    console.error('Error fetching admissions:', err);
  }
}

// Handle Form Submission
async function handleAdmissionSubmit(e) {
  e.preventDefault();

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<span class="spinner-inline"></span> Saving to Database...';

  const formData = new FormData(form);
  const payload = {
    student_name: formData.get('student_name').trim(),
    email: formData.get('email').trim(),
    phone: formData.get('phone').trim(),
    dob: formData.get('dob') || null,
    gender: formData.get('gender'),
    course: formData.get('course'),
    qualification: formData.get('qualification'),
    percentage: formData.get('percentage').trim(),
    city: formData.get('city').trim(),
    state: formData.get('state').trim(),
    address: formData.get('address').trim(),
    status: 'Submitted'
  };

  try {
    const res = await fetch(`${API_BASE}/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.success && result.data) {
      const rec = result.data;
      const appId = `ADM-${String(rec.id).padStart(4, '0')}`;

      submissionReceipt.innerHTML = `
        <div class="receipt-row"><strong>Application ID:</strong> <span>${appId}</span></div>
        <div class="receipt-row"><strong>Student Name:</strong> <span>${escapeHtml(rec.student_name)}</span></div>
        <div class="receipt-row"><strong>Course:</strong> <span>${escapeHtml(rec.course)}</span></div>
        <div class="receipt-row"><strong>Contact:</strong> <span>${escapeHtml(rec.email)} | ${escapeHtml(rec.phone)}</span></div>
        <div class="receipt-row"><strong>Score / Percentage:</strong> <span>${escapeHtml(rec.percentage)}</span></div>
        <div class="receipt-row"><strong>Status in Database:</strong> <span style="color:#10b981;font-weight:600;">Saved in PostgreSQL</span></div>
      `;

      successModal.classList.remove('hidden');
      form.reset();
      await fetchAdmissions();
    } else {
      alert('Error: ' + (result.message || 'Could not save data'));
    }
  } catch (err) {
    alert('Failed to connect to backend: ' + err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<span>Submit Admission Form</span>';
  }
}

// Render Database records in modal
function renderModalRecords() {
  let filtered = [...allAdmissions];

  if (searchQuery) {
    filtered = filtered.filter(a =>
      (a.student_name && a.student_name.toLowerCase().includes(searchQuery)) ||
      (a.email && a.email.toLowerCase().includes(searchQuery)) ||
      (a.course && a.course.toLowerCase().includes(searchQuery)) ||
      (a.city && a.city.toLowerCase().includes(searchQuery))
    );
  }

  if (filtered.length === 0) {
    modalDbRecords.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #94a3b8;">
        No admission records found.
      </div>
    `;
    return;
  }

  modalDbRecords.innerHTML = filtered.map(item => {
    const appId = `ADM-${String(item.id).padStart(4, '0')}`;
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';

    return `
      <div class="db-card-item">
        <div>
          <div class="db-card-name">
            <span>${escapeHtml(item.student_name)}</span>
            <span class="db-badge-id">${appId}</span>
          </div>
          <div class="db-course">📚 ${escapeHtml(item.course)}</div>
          <div class="db-meta">
            <span>✉️ ${escapeHtml(item.email)}</span> • 
            <span>📞 ${escapeHtml(item.phone)}</span> • 
            <span>🎯 ${escapeHtml(item.percentage)}</span> • 
            <span>📍 ${escapeHtml(item.city || 'N/A')}</span> • 
            <span>📅 ${dateStr}</span>
          </div>
        </div>
        <button class="btn-del-sm" onclick="handleDeleteRecord(${item.id})">Delete</button>
      </div>
    `;
  }).join('');
}

// Delete Record
window.handleDeleteRecord = async function(id) {
  if (!confirm(`Are you sure you want to delete Admission Record #${id} from the database?`)) return;

  try {
    const res = await fetch(`${API_BASE}/admissions/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      await fetchAdmissions();
      renderModalRecords();
    } else {
      alert('Delete failed: ' + (result.message || 'Error'));
    }
  } catch (err) {
    alert('Delete error: ' + err.message);
  }
};

// Demo Auto Fill Data
const demoStudents = [
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 9876543210',
    dob: '2004-05-15',
    gender: 'Male',
    course: 'B.Tech - Computer Science',
    qualification: '12th Science',
    percentage: '91.5%',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: '402, Green Park, Andheri West'
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+91 9812345678',
    dob: '2003-08-22',
    gender: 'Female',
    course: 'B.Tech - Artificial Intelligence & ML',
    qualification: '12th Science',
    percentage: '94.0%',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Flat 12, Sunrise Residency, Baner'
  },
  {
    name: 'Amit Kumar Verma',
    email: 'amit.verma@example.com',
    phone: '+91 9765432109',
    dob: '2002-11-10',
    gender: 'Male',
    course: 'MCA - Master of Computer Applications',
    qualification: 'BCA / B.Sc CS',
    percentage: '86.4%',
    city: 'Delhi',
    state: 'Delhi NCR',
    address: 'H-24, Sector 15, Rohini'
  }
];
let demoIdx = 0;

function handleAutoFill() {
  const demo = demoStudents[demoIdx % demoStudents.length];
  demoIdx++;

  document.getElementById('student_name').value = demo.name;
  document.getElementById('email').value = demo.email;
  document.getElementById('phone').value = demo.phone;
  document.getElementById('dob').value = demo.dob;
  document.getElementById('gender').value = demo.gender;
  document.getElementById('course').value = demo.course;
  document.getElementById('qualification').value = demo.qualification;
  document.getElementById('percentage').value = demo.percentage;
  document.getElementById('city').value = demo.city;
  document.getElementById('state').value = demo.state;
  document.getElementById('address').value = demo.address;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
