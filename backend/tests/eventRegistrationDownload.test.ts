import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../src/models/Event.js';
import { EventRegistration } from '../src/models/EventRegistration.js';
import { generateToken } from '../src/utils/jwt.js';

let mongod: MongoMemoryServer | null = null;
let server: http.Server;
let baseUrl = '';

const JWT_TEST_SECRET = 'super_secret_test_jwt_key_1234567890';
process.env.JWT_SECRET = JWT_TEST_SECRET;
process.env.JWT_EXPIRES_IN = '1h';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`, detail || '');
    throw new Error(`Test failed: ${testName}`);
  }
}

async function startTestEnvironment() {
  console.log('\n[Registration Download Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Registration Download Tests] In-memory MongoDB connected: ${uri}`);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect_test';
    await mongoose.connect(fallbackUri);
  }

  await User.deleteMany({});
  await Club.deleteMany({});
  await ClubMembership.deleteMany({});
  await Venue.deleteMany({});
  await Event.deleteMany({});
  await EventRegistration.deleteMany({});

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`[Registration Download Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Registration Download Tests] Tearing down test environment...');
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

async function runTests() {
  try {
    await startTestEnvironment();

    console.log('\n======================================================');
    console.log('  TEST SUITE: Registered Students Documentation API');
    console.log('======================================================\n');

    // 1. Seed Users
    const adminUser = await User.create({
      name: 'Dr. Admin',
      email: 'admin_reg@college.edu',
      password: 'Password@123',
      role: UserRole.COLLEGE_ADMIN,
      department: 'Administration',
      status: 'active'
    });

    const ieeeLeadUser = await User.create({
      name: 'IEEE Lead President',
      email: 'ieee_lead@college.edu',
      password: 'Password@123',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Computer Engineering',
      year: 'BE (4th Year)',
      enrollmentNumber: 'C2K2210001',
      phone: '+91 9988776655',
      status: 'active'
    });

    const acmLeadUser = await User.create({
      name: 'ACM Lead President',
      email: 'acm_lead@college.edu',
      password: 'Password@123',
      role: UserRole.CLUB_PRESIDENT,
      department: 'IT',
      year: 'BE (4th Year)',
      enrollmentNumber: 'C2K2210002',
      status: 'active'
    });

    const formerLeadUser = await User.create({
      name: 'Former IEEE Lead',
      email: 'former_ieee@college.edu',
      password: 'Password@123',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Computer Engineering',
      status: 'active'
    });

    const student1 = await User.create({
      name: 'Aarav Sharma',
      email: 'aarav@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT,
      department: 'Computer Engineering',
      year: 'TE (3rd Year)',
      enrollmentNumber: 'C2K2310055',
      phone: '+91 9123456780',
      status: 'active'
    });

    const student2 = await User.create({
      name: '=Diya Patel', // Test formula injection escape
      email: 'diya@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT,
      department: 'Electronics',
      year: 'SE (2nd Year)',
      enrollmentNumber: 'E2K2410088',
      phone: '+91 9123456781',
      status: 'active'
    });

    const student3 = await User.create({
      name: 'Rohan Gupta',
      email: 'rohan@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT,
      department: 'Mechanical',
      year: 'TE (3rd Year)',
      enrollmentNumber: 'M2K2310099',
      phone: '+91 9123456782',
      status: 'active'
    });

    // 2. Seed Clubs
    const ieeeClub = await Club.create({
      name: 'IEEE Student Branch Pune',
      shortName: 'IEEE-SB',
      description: 'IEEE technical chapter',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    const acmClub = await Club.create({
      name: 'ACM Student Chapter',
      shortName: 'ACM-SC',
      description: 'ACM computing chapter',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    // 3. Seed Memberships
    await ClubMembership.create({
      clubId: ieeeClub._id,
      userId: ieeeLeadUser._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Chairperson',
      isActive: true
    });

    await ClubMembership.create({
      clubId: acmClub._id,
      userId: acmLeadUser._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Chairperson',
      isActive: true
    });

    await ClubMembership.create({
      clubId: ieeeClub._id,
      userId: formerLeadUser._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Past Chairperson',
      isActive: false // Inactive
    });

    // 4. Seed Venue & Events
    const venue = await Venue.create({
      name: 'Auditorium Hall A',
      building: 'Main Building',
      floor: 'Ground',
      capacity: 300,
      facilities: ['Projector', 'Audio'],
      isAvailable: true,
      operationalStatus: VenueOperationalStatus.OPERATIONAL
    });

    const ieeeEvent = await Event.create({
      title: 'IEEE Hackathon 2026',
      eventType: 'Hackathon',
      category: EventCategory.CLUB,
      shortDescription: 'Flagship IEEE Hackathon',
      date: new Date('2026-11-20'),
      startTime: '09:00',
      endTime: '18:00',
      venueId: venue._id,
      clubId: ieeeClub._id,
      proposedBy: ieeeLeadUser._id,
      registrationRequired: true,
      registrationMethod: RegistrationMethod.CAMPUSCONNECT,
      status: EventStatus.APPROVED
    });

    const ieeeEmptyEvent = await Event.create({
      title: 'IEEE Workshop Zero',
      eventType: 'Workshop',
      category: EventCategory.CLUB,
      shortDescription: 'Empty workshop',
      date: new Date('2026-11-25'),
      startTime: '10:00',
      endTime: '12:00',
      venueId: venue._id,
      clubId: ieeeClub._id,
      proposedBy: ieeeLeadUser._id,
      registrationRequired: true,
      registrationMethod: RegistrationMethod.CAMPUSCONNECT,
      status: EventStatus.APPROVED
    });

    const academicEvent = await Event.create({
      title: 'Semester End Examination Circular',
      eventType: 'Academic',
      category: EventCategory.ACADEMIC,
      shortDescription: 'College exam circular',
      date: new Date('2026-12-01'),
      startTime: '10:00',
      endTime: '13:00',
      venueId: venue._id,
      clubId: null,
      proposedBy: adminUser._id,
      registrationRequired: true,
      status: EventStatus.APPROVED
    });

    // 5. Seed Registrations for ieeeEvent
    const regDate1 = new Date('2026-10-01T10:00:00.000Z');
    const regDate2 = new Date('2026-10-02T14:30:00.000Z');
    const regDate3 = new Date('2026-10-03T09:15:00.000Z');

    await EventRegistration.create({
      eventId: ieeeEvent._id,
      studentId: student1._id,
      studentEnrollment: 'C2K2310055',
      teamName: 'ByteBusters',
      registrationDate: regDate1
    });

    await EventRegistration.create({
      eventId: ieeeEvent._id,
      studentId: student2._id,
      studentEnrollment: 'E2K2410088',
      teamName: '+FormulaTeam',
      registrationDate: regDate2
    });

    await EventRegistration.create({
      eventId: ieeeEvent._id,
      studentId: student3._id,
      studentEnrollment: 'M2K2310099',
      teamName: '',
      registrationDate: regDate3
    });

    // Generate Tokens
    const adminToken = generateToken({
      id: adminUser._id.toString(),
      role: adminUser.role,
      email: adminUser.email
    });
    const ieeeLeadToken = generateToken({
      id: ieeeLeadUser._id.toString(),
      role: ieeeLeadUser.role,
      email: ieeeLeadUser.email
    });
    const acmLeadToken = generateToken({
      id: acmLeadUser._id.toString(),
      role: acmLeadUser.role,
      email: acmLeadUser.email
    });
    const formerLeadToken = generateToken({
      id: formerLeadUser._id.toString(),
      role: formerLeadUser.role,
      email: formerLeadUser.email
    });
    const studentToken = generateToken({
      id: student1._id.toString(),
      role: student1.role,
      email: student1.email
    });

    // ==========================================
    // TEST 1: Active Lead of Event's Club -> GET /api/events/:id/registrations
    // ==========================================
    console.log('\n--- 1. View Registrations JSON Authorization ---');
    const resGetLead = await fetch(`${baseUrl}/api/events/${ieeeEvent.id}/registrations`, {
      headers: { Authorization: `Bearer ${ieeeLeadToken}` }
    });
    assert(resGetLead.status === 200, 'Active Lead receives 200 OK on GET registrations');
    const jsonGetLead = (await resGetLead.json()) as any;
    assert(jsonGetLead.success === true, 'JSON response has success: true');
    assert(jsonGetLead.count === 3, 'Returns all 3 registered students');
    assert(jsonGetLead.registrations[0].studentName === 'Aarav Sharma', 'First student name is Aarav Sharma');
    assert(jsonGetLead.registrations[0].teamName === 'ByteBusters', 'First student team is ByteBusters');
    assert(jsonGetLead.registrations[0].attendanceStatus === undefined, 'Does NOT expose attendanceStatus in JSON');
    assert(jsonGetLead.registrations[0].attendedAt === undefined, 'Does NOT expose attendedAt in JSON');

    // ==========================================
    // TEST 2: Active Lead -> Download CSV (GET /api/events/:id/registrations/download)
    // ==========================================
    console.log('\n--- 2. Download Registrations CSV ---');
    const resDownloadLead = await fetch(`${baseUrl}/api/events/${ieeeEvent.id}/registrations/download`, {
      headers: { Authorization: `Bearer ${ieeeLeadToken}` }
    });
    assert(resDownloadLead.status === 200, 'Active Lead receives 200 OK on CSV download');
    const contentType = resDownloadLead.headers.get('content-type') || '';
    assert(contentType.includes('text/csv'), 'Content-Type header is text/csv');
    const contentDisposition = resDownloadLead.headers.get('content-disposition') || '';
    assert(contentDisposition.includes('attachment') && contentDisposition.includes('IEEE_Hackathon_2026'), 'Content-Disposition contains attachment and sanitized event title');

    const csvBody = await resDownloadLead.text();
    const csvLines = csvBody.split('\n');
    assert(csvLines.length === 4, 'CSV contains header + 3 student records (total 4 lines)');
    assert(
      csvLines[0] === 'Student Name,PRN / Enrollment Number,Email,Department,Year,Phone,Team Name,Registration Date',
      'CSV header matches expected documentation columns exactly'
    );

    // Verify student 1
    assert(csvLines[1].includes('"Aarav Sharma"') && csvLines[1].includes('"C2K2310055"') && csvLines[1].includes('"ByteBusters"'), 'Student 1 record present with safe fields');
    // Verify formula injection protection for student 2: '=Diya Patel' -> "'=Diya Patel"
    assert(csvLines[2].includes(`"'=Diya Patel"`), 'Protects against formula injection on name starting with =');
    assert(csvLines[2].includes(`"'+FormulaTeam"`), 'Protects against formula injection on teamName starting with +');

    // Verify absence of sensitive & attendance fields
    assert(!csvBody.includes('attendanceStatus'), 'CSV does not contain attendanceStatus');
    assert(!csvBody.includes('ATTENDED'), 'CSV does not contain ATTENDED keywords');
    assert(!csvBody.includes('attendedAt'), 'CSV does not contain attendedAt');
    assert(!csvBody.includes('Password@123'), 'CSV does not contain password');
    assert(!csvBody.includes('password'), 'CSV does not contain password field');
    assert(!csvBody.includes('securityQuestions'), 'CSV does not contain securityQuestions');
    assert(!csvBody.includes('super_secret'), 'CSV does not contain token or secrets');

    // ==========================================
    // TEST 3: Student -> 403 Forbidden
    // ==========================================
    console.log('\n--- 3. Student Authorization Block ---');
    const resStudentGet = await fetch(`${baseUrl}/api/events/${ieeeEvent.id}/registrations`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resStudentGet.status === 403, 'Student is forbidden (403) from viewing registrations');

    const resStudentDownload = await fetch(`${baseUrl}/api/events/${ieeeEvent.id}/registrations/download`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resStudentDownload.status === 403, 'Student is forbidden (403) from downloading registrations documentation');

    // ==========================================
    // TEST 4: Lead of another club -> 403 Forbidden
    // ==========================================
    console.log('\n--- 4. Lead of Another Club Authorization Block ---');
    const resAcmLeadGet = await fetch(`${baseUrl}/api/events/${ieeeEvent.id}/registrations`, {
      headers: { Authorization: `Bearer ${acmLeadToken}` }
    });
    assert(resAcmLeadGet.status === 403, 'Lead of another club (ACM) is forbidden (403) from viewing IEEE registrations');

    const resAcmLeadDownload = await fetch(`${baseUrl}/api/events/${ieeeEvent.id}/registrations/download`, {
      headers: { Authorization: `Bearer ${acmLeadToken}` }
    });
    assert(resAcmLeadDownload.status === 403, 'Lead of another club (ACM) is forbidden (403) from downloading IEEE registrations');

    // ==========================================
    // TEST 5: Inactive former Lead -> 403 Forbidden
    // ==========================================
    console.log('\n--- 5. Inactive Former Lead Authorization Block ---');
    const resFormerLead = await fetch(`${baseUrl}/api/events/${ieeeEvent.id}/registrations/download`, {
      headers: { Authorization: `Bearer ${formerLeadToken}` }
    });
    assert(resFormerLead.status === 403, 'Inactive former Lead is forbidden (403) from downloading registrations');

    // ==========================================
    // TEST 6: Unauthenticated request -> 401 Unauthorized
    // ==========================================
    console.log('\n--- 6. Unauthenticated Request Block ---');
    const resUnauth = await fetch(`${baseUrl}/api/events/${ieeeEvent.id}/registrations/download`);
    assert(resUnauth.status === 401, 'Unauthenticated request receives 401 Unauthorized');

    // ==========================================
    // TEST 7: Non-existent Event -> 404 Not Found
    // ==========================================
    console.log('\n--- 7. Non-existent Event ---');
    const fakeId = new mongoose.Types.ObjectId().toString();
    const resNotFound = await fetch(`${baseUrl}/api/events/${fakeId}/registrations/download`, {
      headers: { Authorization: `Bearer ${ieeeLeadToken}` }
    });
    assert(resNotFound.status === 404, 'Non-existent event ID receives 404 Not Found');

    const resInvalidId = await fetch(`${baseUrl}/api/events/invalid-id-123/registrations/download`, {
      headers: { Authorization: `Bearer ${ieeeLeadToken}` }
    });
    assert(resInvalidId.status === 400, 'Malformed event ID receives 400 Bad Request');

    // ==========================================
    // TEST 8: Event with Zero Registrations
    // ==========================================
    console.log('\n--- 8. Event with Zero Registrations ---');
    const resZeroReg = await fetch(`${baseUrl}/api/events/${ieeeEmptyEvent.id}/registrations/download`, {
      headers: { Authorization: `Bearer ${ieeeLeadToken}` }
    });
    assert(resZeroReg.status === 200, 'Zero registrations event receives 200 OK');
    const zeroCsvBody = await resZeroReg.text();
    assert(
      zeroCsvBody.trim() === 'Student Name,PRN / Enrollment Number,Email,Department,Year,Phone,Team Name,Registration Date',
      'Zero registrations returns valid CSV with header only'
    );

    // ==========================================
    // TEST 9: Duplicate registration prevention
    // ==========================================
    console.log('\n--- 9. Duplicate Registration Uniqueness ---');
    let duplicateRejected = false;
    try {
      await EventRegistration.create({
        eventId: ieeeEvent._id,
        studentId: student1._id,
        studentEnrollment: 'C2K2310055'
      });
    } catch (e: any) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Unique index prevents duplicate registration for the same event and student');

    // ==========================================
    // TEST 10: Academic Event (no clubId) -> President 403, Admin 200
    // ==========================================
    console.log('\n--- 10. Academic Event Handling ---');
    const resAcademicLead = await fetch(`${baseUrl}/api/events/${academicEvent.id}/registrations/download`, {
      headers: { Authorization: `Bearer ${ieeeLeadToken}` }
    });
    assert(resAcademicLead.status === 403, 'Club Lead is forbidden (403) from downloading registrations for academic events without clubId');

    const resAcademicAdmin = await fetch(`${baseUrl}/api/events/${academicEvent.id}/registrations/download`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAcademicAdmin.status === 200, 'College Admin can access registrations for academic events');

    // ==========================================
    // TEST 11: College Admin Download of Club Event
    // ==========================================
    console.log('\n--- 11. College Admin Privilege ---');
    const resAdminDownload = await fetch(`${baseUrl}/api/events/${ieeeEvent.id}/registrations/download`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminDownload.status === 200, 'College Admin has full access to download club event registration documentation');

    console.log('\n======================================================');
    console.log(`  ALL REGISTRATION DOWNLOAD TESTS PASSED (${passedTests}/${totalTests})`);
    console.log('======================================================\n');
  } finally {
    await stopTestEnvironment();
  }
}

runTests().catch((err) => {
  console.error('[Registration Download Tests] Fatal Error:', err);
  process.exit(1);
});
