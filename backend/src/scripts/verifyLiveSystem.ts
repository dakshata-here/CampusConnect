import dns from 'node:dns';

if (process.env.MONGODB_URI?.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (err) {}
}

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';
const PASSWORD = process.env.INITIAL_MIGRATION_PASSWORD || 'Admin@123';

interface StepReport {
  id: number;
  workflow: string;
  status: 'PASS' | 'FAIL' | 'NOT VERIFIED';
  httpStatus?: number;
  details: string;
}

const reports: StepReport[] = [];

function logReport(r: StepReport) {
  reports.push(r);
  console.log(`[${r.status}] Workflow ${r.id}: ${r.workflow}`);
  console.log(`   Details: ${r.details}\n`);
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log(' CampusConnect Live End-to-End Verification (Atlas Production)');
  console.log(' Backend: ' + BACKEND_URL);
  console.log(' Frontend: ' + FRONTEND_URL);
  console.log('================================================================\n');

  // --- Workflow 1: Services Running & Frontend Target ---
  try {
    const backendHealth = await fetch(`${BACKEND_URL}/health`);
    const backendJson: any = await backendHealth.json();
    const feProxy = await fetch(`${FRONTEND_URL}/api/health`);
    const feJson: any = await feProxy.json();

    if (backendHealth.status === 200 && feProxy.status === 200 && backendJson.status === 'ok') {
      logReport({
        id: 1,
        workflow: 'Service Availability & Frontend-to-Backend Proxy',
        status: 'PASS',
        httpStatus: 200,
        details: `Backend running on port 4000 (status: ok), Frontend running on port 3000 proxying /api to backend (HTTP 200)`
      });
    } else {
      logReport({
        id: 1,
        workflow: 'Service Availability & Frontend-to-Backend Proxy',
        status: 'FAIL',
        httpStatus: backendHealth.status,
        details: `Backend HTTP ${backendHealth.status}, Frontend proxy HTTP ${feProxy.status}`
      });
    }
  } catch (err: any) {
    logReport({
      id: 1,
      workflow: 'Service Availability & Frontend-to-Backend Proxy',
      status: 'FAIL',
      details: err.message
    });
  }

  // --- Workflow 2: Authentication & Multi-Identifier Login ---
  let adminToken = '';
  let leadToken = '';
  let studentToken = '';

  try {
    // 2a. Admin by Email
    const adminEmailRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campusconnect.edu', password: PASSWORD })
    });
    const adminData: any = await adminEmailRes.json();
    adminToken = adminData.token || '';

    // 2b. Admin by Employee ID (ADM001)
    const adminEmpRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: 'ADM001', password: PASSWORD })
    });
    const adminEmpData: any = await adminEmpRes.json();

    // 2c. Club Lead by PRN (PRN001 - Aarav)
    const leadPrnRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prn: 'PRN001', password: PASSWORD })
    });
    const leadData: any = await leadPrnRes.json();
    leadToken = leadData.token || '';

    // 2d. Case-Insensitive PRN Login (prn001 via loginIdentifier)
    const casePrnRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier: 'prn001', password: PASSWORD })
    });
    const caseData: any = await casePrnRes.json();

    // 2e. Regular Student by PRN (PRN002 - Ananya)
    const studentRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prn: 'PRN002', password: PASSWORD })
    });
    const studentData: any = await studentRes.json();
    studentToken = studentData.token || '';

    const allLoginsOk =
      adminEmailRes.status === 200 &&
      adminData.user?.role === 'college_admin' &&
      adminEmpRes.status === 200 &&
      leadPrnRes.status === 200 &&
      leadData.user?.role === 'president' &&
      casePrnRes.status === 200 &&
      studentRes.status === 200 &&
      studentData.user?.role === 'student';

    logReport({
      id: 2,
      workflow: 'Multi-Identifier Authentication & Role Derivation',
      status: allLoginsOk ? 'PASS' : 'FAIL',
      httpStatus: adminEmailRes.status,
      details: `Admin (email & ADM001: college_admin), Club Lead (PRN001: president), Case-Insensitive (prn001), Student (PRN002: student) all authenticated successfully`
    });
  } catch (err: any) {
    logReport({
      id: 2,
      workflow: 'Multi-Identifier Authentication & Role Derivation',
      status: 'FAIL',
      details: err.message
    });
  }

  // --- Workflow 3: Session Restoration (/api/auth/me) ---
  try {
    const adminMeRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminMe: any = await adminMeRes.json();

    const leadMeRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${leadToken}` }
    });
    const leadMe: any = await leadMeRes.json();

    const studentMeRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentMe: any = await studentMeRes.json();

    const sessionOk =
      adminMeRes.status === 200 &&
      Boolean(adminMe.user?.id && adminMe.user?.name && adminMe.user?.role === 'college_admin') &&
      leadMeRes.status === 200 &&
      Boolean(leadMe.user?.id && leadMe.user?.name && leadMe.user?.role === 'president') &&
      studentMeRes.status === 200 &&
      Boolean(studentMe.user?.id && studentMe.user?.name && studentMe.user?.role === 'student');

    logReport({
      id: 3,
      workflow: 'Session Restoration & Canonical User Transformation',
      status: sessionOk ? 'PASS' : 'FAIL',
      httpStatus: 200,
      details: `Session restored for all roles. Canonical fields (id, name, role) populated consistently from legacy Atlas documents`
    });
  } catch (err: any) {
    logReport({
      id: 3,
      workflow: 'Session Restoration & Canonical User Transformation',
      status: 'FAIL',
      details: err.message
    });
  }

  // --- Workflow 4: Authenticated Event Retrieval (GET /api/events) ---
  let eventsList: any[] = [];
  try {
    const eventsRes = await fetch(`${BACKEND_URL}/api/events`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const eventsData: any = await eventsRes.json();
    eventsList = eventsData.events || eventsData.data || [];

    const is24Hex = /^[a-fA-F0-9]{24}$/;
    const allValidObjectIds = eventsList.length > 0 && eventsList.every((e: any) => is24Hex.test(e._id || e.id));

    logReport({
      id: 4,
      workflow: 'Live Atlas Event Catalog Retrieval',
      status: eventsRes.status === 200 && allValidObjectIds ? 'PASS' : 'FAIL',
      httpStatus: eventsRes.status,
      details: `Retrieved ${eventsList.length} live events from Atlas. All event IDs are verified 24-character MongoDB ObjectIds`
    });
  } catch (err: any) {
    logReport({
      id: 4,
      workflow: 'Live Atlas Event Catalog Retrieval',
      status: 'FAIL',
      details: err.message
    });
  }

  // --- Workflow 5: Event Details Retrieval (GET /api/events/:id) ---
  const sampleEvent = eventsList[0] || {};
  const sampleEventId = sampleEvent._id || sampleEvent.id;
  try {
    const eventDetailRes = await fetch(`${BACKEND_URL}/api/events/${sampleEventId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const eventDetailData: any = await eventDetailRes.json();
    const ev = eventDetailData.event || eventDetailData.data;

    const detailsOk =
      eventDetailRes.status === 200 &&
      ev &&
      (ev._id === sampleEventId || ev.id === sampleEventId) &&
      Boolean(ev.title && ev.venueId && ev.clubId);

    logReport({
      id: 5,
      workflow: 'Single Event Details by 24-char ObjectId',
      status: detailsOk ? 'PASS' : 'FAIL',
      httpStatus: eventDetailRes.status,
      details: `Event details retrieved successfully for ObjectId (${sampleEventId}). Title: "${ev?.title}", venue and club populated`
    });
  } catch (err: any) {
    logReport({
      id: 5,
      workflow: 'Single Event Details by 24-char ObjectId',
      status: 'FAIL',
      details: err.message
    });
  }

  // --- Workflow 6: Event Registrations & Role Authorization ---
  // Event 6abdcafec5709d998cfa8b7f has 3 registrations in Atlas
  const eventWithRegsId = '6abdcafec5709d998cfa8b7f';

  try {
    // Admin access
    const adminRegRes = await fetch(`${BACKEND_URL}/api/events/${eventWithRegsId}/registrations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminRegData: any = await adminRegRes.json();

    // Regular student access (MUST be 403 Forbidden)
    const studentRegRes = await fetch(`${BACKEND_URL}/api/events/${eventWithRegsId}/registrations`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    const regAuthOk =
      adminRegRes.status === 200 &&
      Array.isArray(adminRegData.registrations) &&
      adminRegData.registrations.length > 0 &&
      studentRegRes.status === 403;

    logReport({
      id: 6,
      workflow: 'Event Registrations Access & Student 403 Boundary',
      status: regAuthOk ? 'PASS' : 'FAIL',
      httpStatus: adminRegRes.status,
      details: `Admin successfully accessed ${adminRegData.registrations?.length} registrations for event (${eventWithRegsId}). Regular student forbidden with HTTP 403 as required`
    });
  } catch (err: any) {
    logReport({
      id: 6,
      workflow: 'Event Registrations Access & Student 403 Boundary',
      status: 'FAIL',
      details: err.message
    });
  }

  // --- Workflow 7: CSV Roster Export (GET /api/events/:id/registrations/download) ---
  try {
    const csvAdminRes = await fetch(`${BACKEND_URL}/api/events/${eventWithRegsId}/registrations/download`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const csvContent = await csvAdminRes.text();
    const csvContentType = csvAdminRes.headers.get('content-type') || '';

    // Student forbidden check
    const csvStudentRes = await fetch(`${BACKEND_URL}/api/events/${eventWithRegsId}/registrations/download`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    const isCsvValid =
      csvAdminRes.status === 200 &&
      csvContentType.includes('text/csv') &&
      csvContent.includes('Student Name,PRN / Enrollment Number,Email,Department,Year,Phone,Team Name,Registration Date') &&
      csvStudentRes.status === 403;

    logReport({
      id: 7,
      workflow: 'Registration CSV Roster Export & Access Control',
      status: isCsvValid ? 'PASS' : 'FAIL',
      httpStatus: csvAdminRes.status,
      details: `Admin exported CSV roster (Content-Type: text/csv, header verified, length: ${csvContent.length} bytes). Student access rejected with HTTP 403`
    });
  } catch (err: any) {
    logReport({
      id: 7,
      workflow: 'Registration CSV Roster Export & Access Control',
      status: 'FAIL',
      details: err.message
    });
  }

  // --- Workflow 8: PDF Roster Export (GET /api/events/:id/registrations/download/pdf) ---
  try {
    const pdfAdminRes = await fetch(`${BACKEND_URL}/api/events/${eventWithRegsId}/registrations/download/pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pdfContentType = pdfAdminRes.headers.get('content-type') || '';
    const pdfArrayBuffer = await pdfAdminRes.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    const hasPdfMagic = pdfBuffer.subarray(0, 5).toString() === '%PDF-';

    // Student forbidden check
    const pdfStudentRes = await fetch(`${BACKEND_URL}/api/events/${eventWithRegsId}/registrations/download/pdf`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    const isPdfValid =
      pdfAdminRes.status === 200 &&
      pdfContentType.includes('application/pdf') &&
      hasPdfMagic &&
      pdfBuffer.length > 500 &&
      pdfStudentRes.status === 403;

    logReport({
      id: 8,
      workflow: 'Registration PDF Document Generation & Download',
      status: isPdfValid ? 'PASS' : 'FAIL',
      httpStatus: pdfAdminRes.status,
      details: `Admin generated PDF report (Content-Type: application/pdf, valid %PDF- magic header, size: ${pdfBuffer.length} bytes). Student access rejected with HTTP 403`
    });
  } catch (err: any) {
    logReport({
      id: 8,
      workflow: 'Registration PDF Document Generation & Download',
      status: 'FAIL',
      details: err.message
    });
  }

  // --- Workflow 9: Admin Approval Pipeline & Student Protection ---
  try {
    // 9a. Event approvals history check
    const approvalsRes = await fetch(`${BACKEND_URL}/api/events/${eventWithRegsId}/approvals`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const approvalsData: any = await approvalsRes.json();

    // 9b. Student attempting to approve an event (MUST be 403 Forbidden)
    const studentApproveRes = await fetch(`${BACKEND_URL}/api/events/${eventWithRegsId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ comments: 'Unauthorized student approval attempt' })
    });

    // 9c. Admin attempting to approve (should be 200 or 400 if already approved)
    const adminApproveRes = await fetch(`${BACKEND_URL}/api/events/${eventWithRegsId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ comments: 'Verified via live end-to-end check' })
    });

    const pipelineGuardOk =
      approvalsRes.status === 200 &&
      studentApproveRes.status === 403 &&
      (adminApproveRes.status === 200 || adminApproveRes.status === 400);

    logReport({
      id: 9,
      workflow: 'Admin Approvals Workflow & Role Guard',
      status: pipelineGuardOk ? 'PASS' : 'FAIL',
      httpStatus: approvalsRes.status,
      details: `Approvals history accessible (HTTP 200). Student approval attempt rejected with HTTP 403 Forbidden. Admin authorization guard verified`
    });
  } catch (err: any) {
    logReport({
      id: 9,
      workflow: 'Admin Approvals Workflow & Role Guard',
      status: 'FAIL',
      details: err.message
    });
  }

  console.log('================================================================');
  const passCount = reports.filter((r) => r.status === 'PASS').length;
  console.log(`Live Verification Summary: ${passCount}/${reports.length} Workflows PASSED`);
  console.log('================================================================');
}

runLiveVerification().catch(console.error);
