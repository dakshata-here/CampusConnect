import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../src/models/Event.js';
import {
  EventRegistration,
  RegistrationAttendanceStatus,
  AttendanceStatus
} from '../src/models/EventRegistration.js';
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
  console.log('\n[Module 7 Registration & Attendance Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Registration Tests] In-memory MongoDB connected: ${uri}`);
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
      console.log(`[Registration Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Registration Tests] Tearing down test environment...');
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

    const payload = body ? JSON.stringify(body) : undefined;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsedBody: any = {};
          try {
            parsedBody = data ? JSON.parse(data) : {};
          } catch {
            parsedBody = { raw: data };
          }
          resolve({ status: res.statusCode || 500, body: parsedBody });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  try {
    await startTestEnvironment();

    console.log('\n--- Setting up base Users, Clubs, Venue, and Events ---');

    // 1. Admin
    const adminUser = await User.create({
      name: 'Dr. Dean Admin',
      email: 'admin.reg@college.edu',
      password: 'AdminPassword@123',
      role: UserRole.COLLEGE_ADMIN,
      enrollmentNumber: 'ADM-REG-01',
      status: 'active'
    });
    const adminToken = generateToken({
      id: adminUser._id.toString(),
      role: adminUser.role,
      email: adminUser.email
    });

    // 2. President of Tech Club
    const presUser = await User.create({
      name: 'President Alex',
      email: 'pres.reg@college.edu',
      password: 'President@123',
      role: UserRole.CLUB_PRESIDENT,
      enrollmentNumber: 'PRES-REG-01',
      status: 'active'
    });
    const presToken = generateToken({
      id: presUser._id.toString(),
      role: presUser.role,
      email: presUser.email
    });

    // 3. President of Other Club
    const otherPresUser = await User.create({
      name: 'President Other',
      email: 'pres.other@college.edu',
      password: 'President@123',
      role: UserRole.CLUB_PRESIDENT,
      enrollmentNumber: 'PRES-OTHER-01',
      status: 'active'
    });
    const otherPresToken = generateToken({
      id: otherPresUser._id.toString(),
      role: otherPresUser.role,
      email: otherPresUser.email
    });

    // 4. Student 1
    const student1 = await User.create({
      name: 'Alice Cooper',
      email: 'alice.reg@college.edu',
      password: 'Student@123',
      role: UserRole.STUDENT,
      enrollmentNumber: 'CS2026001',
      department: 'Computer Science',
      year: 'TE',
      phone: '+91 98111 22233',
      status: 'active'
    });
    const student1Token = generateToken({
      id: student1._id.toString(),
      role: student1.role,
      email: student1.email
    });

    // 5. Student 2
    const student2 = await User.create({
      name: 'Bob Marley',
      email: 'bob.reg@college.edu',
      password: 'Student@123',
      role: UserRole.STUDENT,
      enrollmentNumber: 'CS2026002',
      department: 'Information Technology',
      year: 'BE',
      phone: '+91 98444 55566',
      status: 'active'
    });
    const student2Token = generateToken({
      id: student2._id.toString(),
      role: student2.role,
      email: student2.email
    });

    // 6. Student 3
    const student3 = await User.create({
      name: 'Charlie Brown',
      email: 'charlie.reg@college.edu',
      password: 'Student@123',
      role: UserRole.STUDENT,
      enrollmentNumber: 'CS2026003',
      department: 'Mechanical',
      year: 'SE',
      phone: '+91 98777 88899',
      status: 'active'
    });
    const student3Token = generateToken({
      id: student3._id.toString(),
      role: student3.role,
      email: student3.email
    });

    // Clubs
    const techClub = await Club.create({
      name: 'Hackathon Club',
      shortName: 'HACK',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    const danceClub = await Club.create({
      name: 'Dance Club',
      shortName: 'DANCE',
      category: ClubCategory.CULTURAL,
      status: ClubStatus.ACTIVE
    });

    // Lead memberships
    await ClubMembership.create({
      clubId: techClub._id,
      userId: presUser._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Club President',
      isActive: true
    });

    await ClubMembership.create({
      clubId: danceClub._id,
      userId: otherPresUser._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Dance Club President',
      isActive: true
    });

    // Venue
    const mainHall = await Venue.create({
      name: 'Main Tech Hall',
      building: 'Building A',
      capacity: 2,
      isAvailable: true,
      operationalStatus: VenueOperationalStatus.OPERATIONAL
    });

    // Approved Event with capacity = 2
    const approvedEvent = await Event.create({
      title: 'AI Hackathon 2026',
      eventType: 'Hackathon',
      category: EventCategory.CLUB,
      clubId: techClub._id,
      venueId: mainHall._id,
      proposedBy: presUser._id,
      date: new Date('2026-11-20'),
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      registrationRequired: true,
      registrationMethod: RegistrationMethod.CAMPUSCONNECT,
      maxParticipants: 2,
      status: EventStatus.APPROVED
    });

    // Pending Event
    const pendingEvent = await Event.create({
      title: 'Unapproved Workshop',
      eventType: 'Workshop',
      category: EventCategory.CLUB,
      clubId: techClub._id,
      proposedBy: presUser._id,
      date: new Date('2026-11-25'),
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      registrationRequired: true,
      status: EventStatus.PENDING_APPROVAL
    });

    // Cancelled Event
    const cancelledEvent = await Event.create({
      title: 'Cancelled Seminar',
      eventType: 'Seminar',
      category: EventCategory.CLUB,
      clubId: techClub._id,
      proposedBy: presUser._id,
      date: new Date('2026-11-28'),
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      registrationRequired: true,
      status: EventStatus.CANCELLED
    });

    // ------------------------------------------------------------------------
    // 1. REGISTRATION WORKFLOW & VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Event Registration & Validation ---');

    // 1. Unauthenticated user cannot register
    const res1 = await apiRequest('POST', `/api/registrations/events/${approvedEvent._id}`);
    assert(res1.status === 401, '1. Unauthenticated user cannot register (401)');

    // 2. Non-existent event ID rejected with 404
    const fakeEventId = new mongoose.Types.ObjectId();
    const res2 = await apiRequest('POST', `/api/registrations/events/${fakeEventId}`, {}, student1Token);
    assert(res2.status === 404, '2. Non-existent event ID rejected (404)');

    // 3. Cannot register for unapproved event (400)
    const res3 = await apiRequest('POST', `/api/registrations/events/${pendingEvent._id}`, {}, student1Token);
    assert(res3.status === 400 && res3.body.message.includes('APPROVED'), '3. Unapproved event rejected with 400');

    // 4. Cannot register for cancelled event (400)
    const res4 = await apiRequest('POST', `/api/registrations/events/${cancelledEvent._id}`, {}, student1Token);
    assert(res4.status === 400 && res4.body.message.includes('APPROVED'), '4. Cancelled event rejected with 400');

    // 5. Student 1 registers successfully
    const res5 = await apiRequest(
      'POST',
      `/api/registrations/events/${approvedEvent._id}`,
      { teamName: 'ByteBusters' },
      student1Token
    );
    assert(res5.status === 201 && res5.body.success === true, '5. Student 1 registers successfully (201)');
    assert(res5.body.registration.studentName === 'Alice Cooper', '5b. Student profile correctly populated');
    assert(res5.body.registration.studentEnrollment === 'CS2026001', '5c. Student enrollment saved');
    assert(Boolean(res5.body.registration.qrCodeData), '5d. QR code ticket identifier returned');
    assert(res5.body.registration.attendanceStatus === RegistrationAttendanceStatus.REGISTERED, '5e. Initial attendance status is REGISTERED');
    const student1RegId = res5.body.registration.id;
    const student1QrData = res5.body.registration.qrCodeData;

    // 6. Student 1 cannot register twice (Duplicate prevention)
    const res6 = await apiRequest(
      'POST',
      `/api/registrations/events/${approvedEvent._id}`,
      { teamName: 'DuplicateTry' },
      student1Token
    );
    assert(res6.status === 409, '6. Duplicate registration rejected with 409 Conflict');

    // 7. Student 2 registers successfully (Fills capacity to 2/2)
    const res7 = await apiRequest(
      'POST',
      `/api/registrations/events/${approvedEvent._id}`,
      { teamName: 'DevDuo' },
      student2Token
    );
    assert(res7.status === 201, '7. Student 2 registers successfully (201, capacity full)');
    const student2QrData = res7.body.registration.qrCodeData;

    // 8. Student 3 cannot register when capacity reached (Capacity guard)
    const res8 = await apiRequest(
      'POST',
      `/api/registrations/events/${approvedEvent._id}`,
      {},
      student3Token
    );
    assert(res8.status === 409 && res8.body.message.includes('capacity'), '8. Registration full rejected with 409 Conflict');

    // ------------------------------------------------------------------------
    // 2. MY REGISTRATIONS & TICKETS QUERY
    // ------------------------------------------------------------------------
    console.log('\n--- 2. My Registrations & QR Passes ---');

    // 9. Student 1 retrieves own registrations
    const res9 = await apiRequest('GET', '/api/registrations/my', undefined, student1Token);
    assert(res9.status === 200 && res9.body.count === 1, '9. Student retrieves personal registration history (200, count 1)');
    assert(res9.body.registrations[0].eventId?.title === 'AI Hackathon 2026', '9b. Populated event details present');

    // ------------------------------------------------------------------------
    // 3. ORGANIZER ATTENDEES ROSTER & STATS
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Organizer Attendee Roster & Stats ---');

    // 10. Student cannot view event attendee roster (403)
    const res10 = await apiRequest('GET', `/api/registrations/events/${approvedEvent._id}`, undefined, student1Token);
    assert(res10.status === 403, '10. Student denied attendee roster access (403)');

    // 11. President of other club cannot view attendee roster (403)
    const res11 = await apiRequest('GET', `/api/registrations/events/${approvedEvent._id}`, undefined, otherPresToken);
    assert(res11.status === 403, '11. Unauthorized President denied attendee roster access (403)');

    // 12. Hosting Club President can view roster & stats
    const res12 = await apiRequest('GET', `/api/registrations/events/${approvedEvent._id}`, undefined, presToken);
    assert(res12.status === 200 && res12.body.stats.totalActive === 2, '12. Club President views roster (200, totalActive 2)');
    assert(res12.body.stats.totalAttended === 0, '12b. Initial attended count is 0');
    assert(res12.body.stats.attendanceRate === 0, '12c. Initial attendance rate is 0%');

    // 13. College Admin can also view roster & stats
    const res13 = await apiRequest('GET', `/api/registrations/events/${approvedEvent._id}`, undefined, adminToken);
    assert(res13.status === 200 && res13.body.count === 2, '13. College Admin views attendee roster (200)');

    // ------------------------------------------------------------------------
    // 4. LIVE QR SCANNING & ATTENDANCE VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Live QR Scanning & Attendance Validation ---');

    // 14. Student cannot scan attendance QR codes (403)
    const res14 = await apiRequest(
      'POST',
      '/api/registrations/scan-qr',
      { qrCodeData: student1QrData },
      student1Token
    );
    assert(res14.status === 403, '14. Student cannot scan QR code (403)');

    // 15. Scanning non-existent QR code returns 404
    const res15 = await apiRequest(
      'POST',
      '/api/registrations/scan-qr',
      { qrCodeData: new mongoose.Types.ObjectId().toString() },
      presToken
    );
    assert(res15.status === 404, '15. Non-existent QR ticket rejected (404 Not Found)');

    // 16. President of other club cannot scan QR codes for this event (403)
    const res16 = await apiRequest(
      'POST',
      '/api/registrations/scan-qr',
      { qrCodeData: student1QrData },
      otherPresToken
    );
    assert(res16.status === 403, '16. Unauthorized President cannot scan QR for other club (403)');

    // 17. Hosting President scans Student 1's valid QR ticket
    const res17 = await apiRequest(
      'POST',
      '/api/registrations/scan-qr',
      { qrCodeData: student1QrData, eventId: approvedEvent._id.toString() },
      presToken
    );
    assert(res17.status === 200 && res17.body.success === true, '17. Valid QR scan verifies attendance (200)');
    assert(res17.body.registration.attendanceStatus === RegistrationAttendanceStatus.ATTENDED, '17b. Attendance status updated to ATTENDED');
    assert(Boolean(res17.body.registration.attendedAt), '17c. attendedAt timestamp recorded');

    // 18. Scanning the SAME QR code again rejects with ALREADY marked present (409)
    const res18 = await apiRequest(
      'POST',
      '/api/registrations/scan-qr',
      { qrCodeData: student1QrData },
      presToken
    );
    assert(res18.status === 409 && res18.body.message.includes('ALREADY marked present'), '18. Duplicate QR scan rejected with 409 Conflict');

    // 19. Admin scans Student 2's valid QR ticket
    const res19 = await apiRequest(
      'POST',
      '/api/registrations/scan-qr',
      { qrCodeData: student2QrData },
      adminToken
    );
    assert(res19.status === 200 && res19.body.registration.attendanceStatus === RegistrationAttendanceStatus.ATTENDED, '19. Admin verifies Student 2 attendance via QR (200)');

    // 20. Check updated stats: 2 attended, 100% attendance rate
    const res20 = await apiRequest('GET', `/api/registrations/events/${approvedEvent._id}`, undefined, presToken);
    assert(res20.status === 200 && res20.body.stats.totalAttended === 2 && res20.body.stats.attendanceRate === 100, '20. Attendee stats show 100% attendance rate');

    // ------------------------------------------------------------------------
    // 5. MANUAL ATTENDANCE TOGGLE & CANCELLATION
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Manual Attendance Toggle & Cancellation ---');

    // 21. Manual update attendance status back to REGISTERED
    const res21 = await apiRequest(
      'PATCH',
      `/api/registrations/${student1RegId}/attendance`,
      { status: RegistrationAttendanceStatus.REGISTERED },
      presToken
    );
    assert(res21.status === 200 && res21.body.registration.attendanceStatus === RegistrationAttendanceStatus.REGISTERED, '21. Manual attendance reset to REGISTERED (200)');

    // 22. Student 2 cannot cancel Student 1's registration (403)
    const res22 = await apiRequest('DELETE', `/api/registrations/${student1RegId}`, undefined, student2Token);
    assert(res22.status === 403, '22. Student 2 forbidden from cancelling Student 1 registration (403)');

    // 23. Student 1 cancels their own registration (200)
    const res23 = await apiRequest('DELETE', `/api/registrations/${student1RegId}`, undefined, student1Token);
    assert(res23.status === 200 && res23.body.registration.attendanceStatus === 'CANCELLED', '23. Student 1 cancels registration pass (200)');

    // 24. Scanning the cancelled registration ticket returns 404
    const res24 = await apiRequest(
      'POST',
      '/api/registrations/scan-qr',
      { qrCodeData: student1QrData },
      presToken
    );
    assert(res24.status === 404, '24. Cancelled pass rejected on scan (404)');

    // 25. Capacity freed up: Student 3 can now register
    const res25 = await apiRequest(
      'POST',
      `/api/registrations/events/${approvedEvent._id}`,
      { teamName: 'FreeSlotTeam' },
      student3Token
    );
    assert(res25.status === 201 && res25.body.registration.attendanceStatus === RegistrationAttendanceStatus.REGISTERED, '25. Student 3 registers successfully after capacity freed (201)');

    console.log(`\n========================================`);
    console.log(`Module 7 Registration Tests: ${passedTests}/${totalTests} Passed.`);
    console.log(`========================================\n`);
  } finally {
    await stopTestEnvironment();
  }
}

runTests().catch((err) => {
  console.error('[Registration Tests FAILED]', err);
  process.exit(1);
});
