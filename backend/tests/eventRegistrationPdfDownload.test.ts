import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../src/models/Event.js';
import { EventRegistration, RegistrationAttendanceStatus } from '../src/models/EventRegistration.js';
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
  console.log('\n[Registration PDF Download Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Registration PDF Download Tests] In-memory MongoDB connected: ${uri}`);
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
      console.log(`[Registration PDF Download Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Registration PDF Download Tests] Tearing down test environment...');
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

async function rawApiRequest(
  method: string,
  path: string,
  token?: string
): Promise<{ status: number; headers: http.IncomingHttpHeaders; buffer: Buffer }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            buffer: Buffer.concat(chunks)
          });
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

async function runPdfDownloadTests() {
  await startTestEnvironment();

  try {
    console.log('\n--- 1. Seed Fixtures (Users, Clubs, Venue, Event, Registrations) ---');
    const admin = await User.create({
      name: 'College Admin Dr. Verma',
      email: 'admin.pdf@campus.edu',
      password: 'Password123!',
      role: UserRole.COLLEGE_ADMIN,
      department: 'Dean Office'
    });
    const adminToken = generateToken({
      id: admin._id.toString(),
      role: admin.role,
      email: admin.email
    });

    const ieeeLead = await User.create({
      name: 'IEEE Lead John',
      email: 'ieee.lead.pdf@campus.edu',
      password: 'Password123!',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Computer Engineering'
    });
    const ieeeLeadToken = generateToken({
      id: ieeeLead._id.toString(),
      role: ieeeLead.role,
      email: ieeeLead.email
    });

    const acmLead = await User.create({
      name: 'ACM Lead Jane',
      email: 'acm.lead.pdf@campus.edu',
      password: 'Password123!',
      role: UserRole.CLUB_PRESIDENT,
      department: 'IT'
    });
    const acmLeadToken = generateToken({
      id: acmLead._id.toString(),
      role: acmLead.role,
      email: acmLead.email
    });

    const student = await User.create({
      name: 'Student Alice',
      email: 'alice.pdf@campus.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      enrollmentNumber: 'EN2026888',
      department: 'Computer Engineering',
      year: '3rd Year',
      phone: '9876543210'
    });
    const studentToken = generateToken({
      id: student._id.toString(),
      role: student.role,
      email: student.email
    });

    const ieeeClub = await Club.create({
      name: 'IEEE Student Branch',
      shortName: 'IEEE',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    const acmClub = await Club.create({
      name: 'ACM Student Chapter',
      shortName: 'ACM',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    await ClubMembership.create({
      clubId: ieeeClub._id,
      userId: ieeeLead._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Chairperson',
      isActive: true
    });

    await ClubMembership.create({
      clubId: acmClub._id,
      userId: acmLead._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Chairperson',
      isActive: true
    });

    const venue = await Venue.create({
      name: 'Auditorium Hall 1',
      building: 'Main Block',
      capacity: 300,
      isAvailable: true,
      operationalStatus: VenueOperationalStatus.OPERATIONAL
    });

    const ieeeEvent = await Event.create({
      title: 'IEEE Tech Hackathon 2026',
      eventType: 'Hackathon',
      category: EventCategory.CLUB,
      status: EventStatus.APPROVED,
      clubId: ieeeClub._id,
      proposedBy: ieeeLead._id,
      venueId: venue._id,
      date: new Date('2026-11-25'),
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      maxParticipants: 100,
      registrationRequired: true,
      registrationMethod: RegistrationMethod.CAMPUSCONNECT
    });

    // Create 2 registrations for IEEE Event
    const reg1 = await EventRegistration.create({
      eventId: ieeeEvent._id,
      studentId: student._id,
      studentEnrollment: 'EN2026888',
      teamName: 'CodeWarriors',
      registrationDate: new Date('2026-10-01'),
      attendanceStatus: RegistrationAttendanceStatus.REGISTERED
    });

    const student2 = await User.create({
      name: 'Student Bob',
      email: 'bob.pdf@campus.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      enrollmentNumber: 'EN2026999',
      department: 'Information Technology',
      year: '2nd Year',
      phone: '9123456780'
    });

    const reg2 = await EventRegistration.create({
      eventId: ieeeEvent._id,
      studentId: student2._id,
      studentEnrollment: 'EN2026999',
      teamName: 'ByteBuilders',
      registrationDate: new Date('2026-10-02'),
      attendanceStatus: RegistrationAttendanceStatus.ATTENDED
    });

    // Empty event for zero registration check
    const emptyEvent = await Event.create({
      title: 'Zero Registrations Seminar',
      eventType: 'Seminar',
      category: EventCategory.CLUB,
      status: EventStatus.APPROVED,
      clubId: ieeeClub._id,
      proposedBy: ieeeLead._id,
      venueId: venue._id,
      date: new Date('2026-12-01'),
      startTime: '10:00 AM',
      endTime: '12:00 PM'
    });

    assert(Boolean(reg1._id) && Boolean(reg2._id), 'Fixtures and registrations created successfully');

    console.log('\n--- 2. Unauthenticated Access (401) ---');
    const unauthRes = await rawApiRequest('GET', `/api/events/${ieeeEvent._id}/registrations/download/pdf`);
    assert(unauthRes.status === 401, 'Unauthenticated request receives 401');

    console.log('\n--- 3. Student Access Forbidden (403) ---');
    const studentRes = await rawApiRequest(
      'GET',
      `/api/events/${ieeeEvent._id}/registrations/download/pdf`,
      studentToken
    );
    assert(studentRes.status === 403, 'Student is forbidden (403) from downloading PDF');

    console.log('\n--- 4. Non-Leading Club Lead Forbidden (403) ---');
    const nonLeadRes = await rawApiRequest(
      'GET',
      `/api/events/${ieeeEvent._id}/registrations/download/pdf`,
      acmLeadToken
    );
    assert(nonLeadRes.status === 403, 'ACM Lead forbidden (403) from downloading IEEE event PDF');

    console.log('\n--- 5. Active Event Club Lead Downloads PDF (200) ---');
    const leadRes = await rawApiRequest(
      'GET',
      `/api/events/${ieeeEvent._id}/registrations/download/pdf`,
      ieeeLeadToken
    );
    assert(leadRes.status === 200, 'Active IEEE Lead receives 200 OK');
    assert(
      leadRes.headers['content-type']?.includes('application/pdf'),
      'Content-Type is application/pdf'
    );
    assert(
      leadRes.headers['content-disposition']?.includes('attachment; filename='),
      'Content-Disposition header triggers attachment download'
    );
    assert(
      leadRes.headers['content-disposition']?.includes('CampusConnect_IEEE_Tech_Hackathon_2026_Registered_Students.pdf'),
      'Filename matches expected sanitized convention'
    );
    assert(leadRes.buffer.subarray(0, 4).toString() === '%PDF', 'Buffer starts with valid %PDF magic header');
    assert(leadRes.buffer.length > 500, 'PDF buffer has substantial payload size');

    console.log('\n--- 6. College Admin Downloads PDF (200) ---');
    const adminRes = await rawApiRequest(
      'GET',
      `/api/events/${ieeeEvent._id}/registrations/download/pdf`,
      adminToken
    );
    assert(adminRes.status === 200, 'College Admin receives 200 OK');
    assert(
      adminRes.headers['content-type']?.includes('application/pdf'),
      'Admin receives application/pdf'
    );
    assert(adminRes.buffer.subarray(0, 4).toString() === '%PDF', 'Admin response is valid %PDF stream');

    console.log('\n--- 7. Nonexistent & Invalid Event ID Handling ---');
    const notFoundRes = await rawApiRequest(
      'GET',
      `/api/events/${new mongoose.Types.ObjectId()}/registrations/download/pdf`,
      adminToken
    );
    assert(notFoundRes.status === 404, 'Nonexistent event returns 404');

    const badIdRes = await rawApiRequest(
      'GET',
      '/api/events/invalid-event-id-123/registrations/download/pdf',
      adminToken
    );
    assert(badIdRes.status === 400, 'Malformed event ID returns 400');

    console.log('\n--- 8. Zero Registrations Event PDF ---');
    const zeroRes = await rawApiRequest(
      'GET',
      `/api/events/${emptyEvent._id}/registrations/download/pdf`,
      ieeeLeadToken
    );
    assert(zeroRes.status === 200, 'Event with 0 registrations receives 200 OK');
    assert(
      zeroRes.headers['content-type']?.includes('application/pdf'),
      'Zero registrations response is application/pdf'
    );
    assert(zeroRes.buffer.subarray(0, 4).toString() === '%PDF', 'Zero registrations returns valid PDF document');

    console.log('\n--- 9. Existing CSV Endpoint Preservation ---');
    const csvRes = await rawApiRequest(
      'GET',
      `/api/events/${ieeeEvent._id}/registrations/download`,
      ieeeLeadToken
    );
    assert(csvRes.status === 200, 'Existing CSV download returns 200 OK');
    assert(
      csvRes.headers['content-type']?.includes('text/csv'),
      'CSV Content-Type is text/csv'
    );
    const csvContent = csvRes.buffer.toString('utf-8');
    assert(csvContent.includes('Student Name,PRN / Enrollment Number,Email,Department,Year,Phone,Team Name,Registration Date'), 'CSV contains correct header columns');
    assert(csvContent.includes('Student Alice'), 'CSV contains Student Alice');
    assert(csvContent.includes('Student Bob'), 'CSV contains Student Bob');
    assert(!csvContent.includes('attendanceStatus'), 'CSV does not contain attendanceStatus');
    assert(!csvContent.includes('qrCodeData'), 'CSV does not contain qrCodeData');

    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${passedTests}/${totalTests} REGISTRATION PDF DOWNLOAD TESTS PASSED!`);
    console.log(`======================================================\n`);
  } finally {
    await stopTestEnvironment();
  }
}

runPdfDownloadTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
