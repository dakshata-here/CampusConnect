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
import { Certificate } from '../src/models/Certificate.js';
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
  console.log('\n[Certificate Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Certificate Tests] In-memory MongoDB connected: ${uri}`);
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
  await Certificate.deleteMany({});

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`[Certificate Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Certificate Tests] Tearing down test environment...');
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

async function apiRequest(
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

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
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = { raw: data };
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runCertificateTests() {
  await startTestEnvironment();

  try {
    console.log('\n--- 1. Seed Fixtures (Users, Club, Event) ---');
    const admin = await User.create({
      name: 'College Admin',
      email: 'admin.cert@campus.edu',
      password: 'Password123!',
      role: UserRole.COLLEGE_ADMIN,
      department: 'Dean Office'
    });
    const adminToken = generateToken({
      id: admin._id.toString(),
      role: admin.role,
      email: admin.email
    });

    const president = await User.create({
      name: 'Club Lead',
      email: 'lead.cert@campus.edu',
      password: 'Password123!',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Robotics Engineering'
    });
    const presidentToken = generateToken({
      id: president._id.toString(),
      role: president.role,
      email: president.email
    });

    const student1 = await User.create({
      name: 'Alice Student',
      email: 'alice.cert@campus.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      enrollmentNumber: 'EN2026101',
      department: 'Computer Engineering',
      year: '3rd Year'
    });
    const student1Token = generateToken({
      id: student1._id.toString(),
      role: student1.role,
      email: student1.email
    });

    const student2 = await User.create({
      name: 'Bob Student',
      email: 'bob.cert@campus.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      enrollmentNumber: 'EN2026102',
      department: 'Information Technology',
      year: '2nd Year'
    });
    const student2Token = generateToken({
      id: student2._id.toString(),
      role: student2.role,
      email: student2.email
    });

    const club = await Club.create({
      name: 'Robotics Club Cert',
      shortName: 'ROBO',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    await ClubMembership.create({
      clubId: club._id,
      userId: president._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Club President',
      isActive: true
    });

    const venue = await Venue.create({
      name: 'Tech Center Hall A',
      building: 'Building T',
      capacity: 100,
      isAvailable: true,
      operationalStatus: VenueOperationalStatus.OPERATIONAL
    });

    const event = await Event.create({
      title: 'AI & Robotics Bootcamp',
      eventType: 'Workshop',
      category: EventCategory.CLUB,
      status: EventStatus.APPROVED,
      clubId: club._id,
      proposedBy: president._id,
      venueId: venue._id,
      date: new Date('2026-11-20'),
      startTime: '10:00 AM',
      endTime: '03:00 PM',
      maxParticipants: 50,
      registrationRequired: true,
      registrationMethod: RegistrationMethod.CAMPUSCONNECT
    });

    assert(Boolean(event._id), 'Test fixture seeded successfully');

    console.log('\n--- 2. Register Student & Issue Certificate on Attendance ---');
    // Student 1 registers
    const regRes = await apiRequest('POST', `/api/registrations/events/${event._id}`, {}, student1Token);
    assert(regRes.status === 201, 'Student 1 registers successfully');
    const qrData = regRes.body.registration.qrCodeData;
    const regId = regRes.body.registration.id || regRes.body.registration._id;

    // Initially no certificates
    const initCerts = await apiRequest('GET', '/api/certificates/my', undefined, student1Token);
    assert(initCerts.status === 200 && initCerts.body.count === 0, 'Alice has 0 certificates before attending');

    // QR scan marks Alice as attended
    const scanRes = await apiRequest(
      'POST',
      '/api/registrations/scan-qr',
      { qrCodeData: qrData, eventId: event._id.toString() },
      presidentToken
    );
    assert(scanRes.status === 200, 'QR scan successfully verified');
    assert(scanRes.body.registration.attendanceStatus === RegistrationAttendanceStatus.ATTENDED, 'Alice marked as ATTENDED');

    // Issue certificate
    const issueRes = await apiRequest(
      'POST',
      `/api/certificates/issue/${regId}`,
      {},
      presidentToken
    );
    assert(issueRes.status === 200, 'Certificate issued successfully for attended student');
    const certCode = issueRes.body.certificate.certificateNumber || issueRes.body.certificate.certificateCode;
    const certId = issueRes.body.certificate.id || issueRes.body.certificate._id;
    assert(certCode.includes('-CERT-'), 'Certificate code has standard -CERT- format');

    console.log('\n--- 3. GET /api/certificates/my ---');
    const myCerts = await apiRequest('GET', '/api/certificates/my', undefined, student1Token);
    assert(myCerts.status === 200, 'Alice can fetch her certificates');
    assert(myCerts.body.count === 1, 'Alice has exactly 1 certificate');
    assert(
      myCerts.body.certificates[0].certificateCode === certCode ||
      myCerts.body.certificates[0].certificateNumber === certCode,
      'Certificate code matches'
    );
    assert(myCerts.body.certificates[0].eventTitle === 'AI & Robotics Bootcamp', 'Event title is populated');

    // Bob has 0 certificates
    const bobCerts = await apiRequest('GET', '/api/certificates/my', undefined, student2Token);
    assert(bobCerts.status === 200 && bobCerts.body.count === 0, 'Bob has 0 certificates');

    console.log('\n--- 4. GET /api/certificates/:id ---');
    // Alice fetches her own certificate by ID
    const aliceCertDetail = await apiRequest('GET', `/api/certificates/${certId}`, undefined, student1Token);
    assert(aliceCertDetail.status === 200, 'Alice can view her certificate details');
    assert(
      aliceCertDetail.body.certificate.certificateCode === certCode ||
      aliceCertDetail.body.certificate.certificateNumber === certCode,
      'Certificate code matches in detail view'
    );

    // Bob tries to access Alice's certificate by ID (should be 403 Forbidden)
    const bobAccessAlice = await apiRequest('GET', `/api/certificates/${certId}`, undefined, student2Token);
    assert(bobAccessAlice.status === 403, 'Bob cannot view Alice certificate (403 Forbidden)');

    // Admin can access any certificate
    const adminAccess = await apiRequest('GET', `/api/certificates/${certId}`, undefined, adminToken);
    assert(adminAccess.status === 200, 'Admin can view any certificate');

    console.log('\n--- 5. Public Certificate Verification (GET /api/certificates/verify/:code) ---');
    // Public verification without any auth token
    const publicVerify = await apiRequest('GET', `/api/certificates/verify/${certCode}`);
    assert(publicVerify.status === 200, 'Public verification succeeds without token');
    assert(publicVerify.body.valid === true, 'Verification returns valid: true');
    assert(publicVerify.body.certificate.studentName === 'Alice Student', 'Verified student name matches');
    assert(publicVerify.body.certificate.eventTitle === 'AI & Robotics Bootcamp', 'Verified event title matches');
    assert(
      publicVerify.body.certificate.certificateCode === certCode ||
      publicVerify.body.certificate.certificateNumber === certCode,
      'Verified code matches'
    );

    // Invalid certificate verification
    const invalidVerify = await apiRequest('GET', '/api/certificates/verify/NON-EXISTENT-CODE-1234');
    assert(invalidVerify.status === 404, 'Invalid certificate code returns 404');
    assert(invalidVerify.body.valid === false, 'Invalid verification returns valid: false');

    console.log('\n--- 6. GET /api/certificates/events/:eventId (Organizer / Admin view) ---');
    // President can view all certificates for their event
    const eventCertsPres = await apiRequest('GET', `/api/certificates/events/${event._id}`, undefined, presidentToken);
    assert(eventCertsPres.status === 200, 'Event organizer can fetch event certificates');
    assert(eventCertsPres.body.count === 1, 'Event has 1 certificate issued');

    // Bob (student) cannot view event roster of certificates
    const bobEventCerts = await apiRequest('GET', `/api/certificates/events/${event._id}`, undefined, student2Token);
    assert(bobEventCerts.status === 403, 'Regular student cannot view event certificate roster');

    console.log('\n--- 7. Manual Certificate Issuance Rules (POST /api/certificates/issue/:registrationId) ---');
    // Bob registers
    const bobReg = await apiRequest('POST', `/api/registrations/events/${event._id}`, {}, student2Token);
    assert(bobReg.status === 201, 'Bob registers for event');
    const bobRegId = bobReg.body.registration.id || bobReg.body.registration._id;

    // Attempting to issue certificate before attendance should fail with 400
    const prematureIssue = await apiRequest(
      'POST',
      `/api/certificates/issue/${bobRegId}`,
      {},
      presidentToken
    );
    assert(prematureIssue.status === 400, 'Cannot issue certificate if attendee has not attended (status is REGISTERED)');

    // Organizer marks Bob attended manually
    const attendUpdate = await apiRequest(
      'PATCH',
      `/api/registrations/${bobRegId}/attendance`,
      { status: 'ATTENDED' },
      presidentToken
    );
    assert(attendUpdate.status === 200, 'Bob marked as ATTENDED');

    // Now issue certificate for Bob
    const bobIssueRes = await apiRequest(
      'POST',
      `/api/certificates/issue/${bobRegId}`,
      {},
      presidentToken
    );
    assert(bobIssueRes.status === 200, 'Certificate issued for Bob after attendance verified');

    // Verify Bob received certificate
    const bobCertsAfter = await apiRequest('GET', '/api/certificates/my', undefined, student2Token);
    assert(bobCertsAfter.status === 200 && bobCertsAfter.body.count === 1, 'Bob now has 1 certificate after attendance toggle');

    // Attempt duplicate certificate issuance returns existing certificate safely
    const duplicateIssue = await apiRequest(
      'POST',
      `/api/certificates/issue/${bobRegId}`,
      {},
      presidentToken
    );
    assert(duplicateIssue.status === 200, 'Duplicate certificate issuance handled safely');

    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${passedTests}/${totalTests} CERTIFICATE TESTS PASSED SUCCESSFULLY!`);
    console.log(`======================================================\n`);
  } finally {
    await stopTestEnvironment();
  }
}

runCertificateTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
