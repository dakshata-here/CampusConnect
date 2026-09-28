import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../src/models/Event.js';
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
  console.log('\n[Event Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Event Tests] In-memory MongoDB connected: ${uri}`);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect_test';
    await mongoose.connect(fallbackUri);
  }

  await User.deleteMany({});
  await Club.deleteMany({});
  await ClubMembership.deleteMany({});
  await Venue.deleteMany({});
  await Event.deleteMany({});

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`[Event Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Event Tests] Tearing down test environment...');
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
    const postData = body ? JSON.stringify(body) : '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode || 500,
            body: parsed
          });
        });
      }
    );

    req.on('error', (e) => reject(e));
    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

// ----------------------------------------------------
// Test Suite Execution
// ----------------------------------------------------
async function runTests() {
  await startTestEnvironment();

  try {
    // ------------------------------------------------------------------------
    // SETUP TEST DATA
    // ------------------------------------------------------------------------
    console.log('\n--- Setting up base Users, Clubs, Venues, and Memberships ---');

    // Admin user
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin.events@campusconnect.edu',
      password: 'Password123!',
      role: UserRole.COLLEGE_ADMIN,
      department: 'Computer Science',
      collegeUid: 'ADMIN001'
    });
    const adminToken = generateToken({
      id: (adminUser._id as any).toString(),
      role: adminUser.role,
      email: adminUser.email
    });

    // President of Club 1 (Coding Club)
    const president1 = await User.create({
      name: 'President One',
      email: 'pres1.events@campusconnect.edu',
      password: 'Password123!',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Computer Science',
      collegeUid: 'PRES001'
    });
    const pres1Token = generateToken({
      id: (president1._id as any).toString(),
      role: president1.role,
      email: president1.email
    });

    // President of Club 2 (Robotics Club)
    const president2 = await User.create({
      name: 'President Two',
      email: 'pres2.events@campusconnect.edu',
      password: 'Password123!',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Mechanical Engineering',
      collegeUid: 'PRES002'
    });
    const pres2Token = generateToken({
      id: (president2._id as any).toString(),
      role: president2.role,
      email: president2.email
    });

    // Regular student
    const studentUser = await User.create({
      name: 'Student One',
      email: 'student.events@campusconnect.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      department: 'Computer Science',
      collegeUid: 'STU001'
    });
    const studentToken = generateToken({
      id: (studentUser._id as any).toString(),
      role: studentUser.role,
      email: studentUser.email
    });

    // Club 1: Coding Club
    const club1 = await Club.create({
      name: 'Coding Club',
      shortName: 'CC',
      description: 'Official Coding Club',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    // Club 2: Robotics Club
    const club2 = await Club.create({
      name: 'Robotics Club',
      shortName: 'RC',
      description: 'Official Robotics Club',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    // Memberships:
    // President 1 is active LEAD of Club 1
    await ClubMembership.create({
      clubId: club1._id,
      userId: president1._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Club President',
      isActive: true
    });

    // President 2 is active LEAD of Club 2
    await ClubMembership.create({
      clubId: club2._id,
      userId: president2._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Club President',
      isActive: true
    });

    // Venue
    const mainAuditorium = await Venue.create({
      name: 'Main Auditorium',
      building: 'Academic Block A',
      floor: '1st Floor',
      capacity: 500,
      facilities: ['Projector', 'Sound System', 'Stage Lights'],
      isAvailable: true,
      operationalStatus: VenueOperationalStatus.OPERATIONAL
    });

    // ------------------------------------------------------------------------
    // AUTHORIZATION TESTS
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Authorization: Event Creation ---');

    // 1. Student cannot create event
    const res1 = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Student Hackathon',
        eventType: 'Hackathon',
        category: EventCategory.CLUB,
        clubId: club1._id.toString(),
        date: '2026-10-15',
        startTime: '10:00 AM',
        endTime: '05:00 PM'
      },
      studentToken
    );
    assert(res1.status === 403, '1. Student cannot create event (403)');

    // 2. Unauthenticated user cannot create event
    const res2 = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Unauthenticated Event',
        eventType: 'Workshop',
        category: EventCategory.CLUB,
        clubId: club1._id.toString(),
        date: '2026-10-15',
        startTime: '10:00 AM',
        endTime: '05:00 PM'
      }
    );
    assert(res2.status === 401, '2. Unauthenticated user cannot create event (401)');

    // 3. President who is not a LEAD of Club 2 cannot create an event for Club 2
    const res3 = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Unauthorized Club Event',
        eventType: 'Seminar',
        category: EventCategory.CLUB,
        clubId: club2._id.toString(), // Club 2, but pres1 is only lead of Club 1
        date: '2026-10-15',
        startTime: '10:00 AM',
        endTime: '05:00 PM'
      },
      pres1Token
    );
    assert(res3.status === 403, '3. President who is not a LEAD of target club cannot create event (403)');

    // 4. President who is active LEAD can create an event for their club
    const res4 = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Annual Code Fest',
        eventType: 'Hackathon',
        category: EventCategory.CLUB,
        clubId: club1._id.toString(),
        venueId: mainAuditorium._id.toString(),
        date: '2026-10-20',
        startTime: '09:00 AM',
        endTime: '06:00 PM',
        shortDescription: 'Join the annual code fest!',
        maxParticipants: 100,
        registrationRequired: true,
        registrationMethod: RegistrationMethod.CAMPUSCONNECT
      },
      pres1Token
    );
    assert(res4.status === 201 && res4.body.success === true, '4. President who is LEAD can create an event for their club (201)');
    const club1EventId = res4.body.event.id;

    // President 2 creates an event for Club 2
    const res4b = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'RoboWars 2026',
        eventType: 'Competition',
        category: EventCategory.CLUB,
        clubId: club2._id.toString(),
        venueId: mainAuditorium._id.toString(),
        date: '2026-11-05',
        startTime: '11:00 AM',
        endTime: '04:00 PM'
      },
      pres2Token
    );
    assert(res4b.status === 201, '4b. President 2 can create event for Club 2 (201)');
    const club2EventId = res4b.body.event.id;

    // 5. President 1 cannot update Club 2's event
    const res5 = await apiRequest(
      'PUT',
      `/api/events/${club2EventId}`,
      {
        title: 'Hacked RoboWars'
      },
      pres1Token
    );
    assert(res5.status === 403, "5. President cannot update another club's event (403)");

    // 6. President 1 can update their own club's event
    const res6 = await apiRequest(
      'PUT',
      `/api/events/${club1EventId}`,
      {
        title: 'Annual Code Fest 2026 (Updated)',
        shortDescription: 'Updated description for hackathon.'
      },
      pres1Token
    );
    assert(res6.status === 200 && res6.body.event.title === 'Annual Code Fest 2026 (Updated)', "6. President can update their own club's event (200)");

    // 7. President 1 cannot cancel Club 2's event
    const res7 = await apiRequest(
      'PATCH',
      `/api/events/${club2EventId}/cancel`,
      { reason: 'Unauthorized cancellation' },
      pres1Token
    );
    assert(res7.status === 403, "7. President cannot cancel another club's event (403)");

    // 8. President 1 can cancel their own club's event
    const res8 = await apiRequest(
      'PATCH',
      `/api/events/${club1EventId}/cancel`,
      { reason: 'Postponed due to exams' },
      pres1Token
    );
    assert(res8.status === 200 && res8.body.event.status === EventStatus.CANCELLED, "8. President can cancel their own club's event (200)");

    // 9. College Admin can create, update, and cancel events
    const res9Create = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'University Tech Symposium',
        eventType: 'Symposium',
        category: EventCategory.ACADEMIC,
        venueId: mainAuditorium._id.toString(),
        date: '2026-12-01',
        startTime: '09:00 AM',
        endTime: '05:00 PM'
      },
      adminToken
    );
    assert(res9Create.status === 201 && res9Create.body.event.category === EventCategory.ACADEMIC, '9a. College Admin can create academic event (201)');
    const adminEventId = res9Create.body.event.id;

    const res9Update = await apiRequest(
      'PUT',
      `/api/events/${adminEventId}`,
      {
        title: 'University Tech Symposium 2026 (Official)'
      },
      adminToken
    );
    assert(res9Update.status === 200 && res9Update.body.event.title === 'University Tech Symposium 2026 (Official)', '9b. College Admin can update event (200)');

    const res9Cancel = await apiRequest(
      'PATCH',
      `/api/events/${adminEventId}/cancel`,
      { cancellationReason: 'Admin schedule revision' },
      adminToken
    );
    assert(res9Cancel.status === 200 && res9Cancel.body.event.status === EventStatus.CANCELLED, '9c. College Admin can cancel event (200)');

    // ------------------------------------------------------------------------
    // CRUD & DATA INTEGRITY TESTS
    // ------------------------------------------------------------------------
    console.log('\n--- 2. CRUD & Data Integrity ---');

    // 10. Create event successfully (Club Event by Admin)
    const res10 = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'AI & ML Masterclass',
        eventType: 'Workshop',
        category: EventCategory.CLUB,
        clubId: club1._id.toString(),
        venueId: mainAuditorium._id.toString(),
        date: '2026-11-10',
        startTime: '02:00 PM',
        endTime: '05:00 PM',
        registrationRequired: true,
        registrationMethod: RegistrationMethod.CAMPUSCONNECT,
        maxParticipants: 50
      },
      adminToken
    );
    assert(res10.status === 201 && res10.body.event.title === 'AI & ML Masterclass', '10. Create event successfully (201)');
    const newEventId = res10.body.event.id;

    // 11. Get event by ID (accessible by student)
    const res11 = await apiRequest(
      'GET',
      `/api/events/${newEventId}`,
      undefined,
      studentToken
    );
    assert(res11.status === 200 && res11.body.event.id === newEventId, '11. Get event by ID (200)');
    assert(res11.body.event.clubId?.name === 'Coding Club', '11b. Populated club relation present');
    assert(res11.body.event.venueId?.name === 'Main Auditorium', '11c. Populated venue relation present');
    assert(res11.body.event.proposedBy?.email === 'admin.events@campusconnect.edu', '11d. Populated proposedBy relation present');

    // 12. List events (accessible by student, president, admin)
    const res12 = await apiRequest(
      'GET',
      '/api/events',
      undefined,
      studentToken
    );
    assert(res12.status === 200 && Array.isArray(res12.body.events) && res12.body.count >= 4, '12. List events returns all events (200)');

    // 13. Update event fields
    const res13 = await apiRequest(
      'PUT',
      `/api/events/${newEventId}`,
      {
        maxParticipants: 75,
        agenda: '1. Introduction to ML\n2. Hands-on PyTorch',
        contactPerson: 'Jane Doe',
        contactEmail: 'jane@campusconnect.edu'
      },
      pres1Token
    );
    assert(res13.status === 200 && res13.body.event.maxParticipants === 75 && res13.body.event.contactPerson === 'Jane Doe', '13. Update event fields successfully (200)');

    // 14. Cancel event changes status to CANCELLED
    const res14 = await apiRequest(
      'PATCH',
      `/api/events/${newEventId}/cancel`,
      { reason: 'Speaker unavailable' },
      pres1Token
    );
    assert(res14.status === 200 && res14.body.event.status === EventStatus.CANCELLED, '14. Cancel event changes status to CANCELLED (200)');

    // 15. proposedBy is taken strictly from authenticated user
    const res15 = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Web Security Workshop',
        eventType: 'Workshop',
        category: EventCategory.CLUB,
        clubId: club1._id.toString(),
        date: '2026-11-25',
        startTime: '01:00 PM',
        endTime: '04:00 PM'
      },
      pres1Token
    );
    assert(res15.status === 201, '15a. Event created');
    assert(res15.body.event.proposedBy === president1._id.toString(), '15b. proposedBy matches president1 ID');

    // 16. Client cannot overwrite proposedBy in request body
    const fakeUserId = new mongoose.Types.ObjectId().toString();
    const res16Create = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Cloud Computing Demo',
        eventType: 'Demo',
        category: EventCategory.CLUB,
        clubId: club1._id.toString(),
        date: '2026-11-28',
        startTime: '01:00 PM',
        endTime: '04:00 PM',
        proposedBy: fakeUserId,
        createdBy: fakeUserId
      },
      pres1Token
    );
    assert(res16Create.status === 201 && res16Create.body.event.proposedBy === president1._id.toString(), '16a. proposedBy cannot be spoofed on create');

    const res16Update = await apiRequest(
      'PUT',
      `/api/events/${res16Create.body.event.id}`,
      {
        proposedBy: fakeUserId
      },
      pres1Token
    );
    assert(res16Update.status === 200, '16b. Update succeeds');
    const checkEventDoc = await Event.findById(res16Create.body.event.id);
    assert(checkEventDoc?.proposedBy.toString() === president1._id.toString(), '16c. proposedBy remains unchanged after update attempt');

    // 17. Missing event returns 404
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res17Get = await apiRequest('GET', `/api/events/${nonExistentId}`, undefined, studentToken);
    assert(res17Get.status === 404, '17a. Missing event GET returns 404');

    const res17Put = await apiRequest('PUT', `/api/events/${nonExistentId}`, { title: 'Ghost Event' }, adminToken);
    assert(res17Put.status === 404, '17b. Missing event PUT returns 404');

    const res17Cancel = await apiRequest('PATCH', `/api/events/${nonExistentId}/cancel`, {}, adminToken);
    assert(res17Cancel.status === 404, '17c. Missing event PATCH cancel returns 404');

    // 18. Invalid referenced club/venue handling
    const res18BadClub = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Bad Club Event',
        eventType: 'Demo',
        category: EventCategory.CLUB,
        clubId: nonExistentId,
        date: '2026-12-01',
        startTime: '10:00 AM',
        endTime: '12:00 PM'
      },
      adminToken
    );
    assert(res18BadClub.status === 404, '18a. Non-existent clubId returns 404');

    const res18BadVenue = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Bad Venue Event',
        eventType: 'Demo',
        category: EventCategory.CLUB,
        clubId: club1._id.toString(),
        venueId: nonExistentId,
        date: '2026-12-01',
        startTime: '10:00 AM',
        endTime: '12:00 PM'
      },
      adminToken
    );
    assert(res18BadVenue.status === 404, '18b. Non-existent venueId returns 404');

    // 19. Exact Event enum values are respected & invalid ones rejected
    const res19BadCategory = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Invalid Category Event',
        eventType: 'Demo',
        category: 'INVALID_CATEGORY',
        clubId: club1._id.toString(),
        date: '2026-12-01',
        startTime: '10:00 AM',
        endTime: '12:00 PM'
      },
      adminToken
    );
    assert(res19BadCategory.status === 400, '19a. Invalid Event category is rejected (400)');

    const res19BadMethod = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Invalid Reg Method Event',
        eventType: 'Demo',
        category: EventCategory.CLUB,
        clubId: club1._id.toString(),
        date: '2026-12-01',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        registrationMethod: 'RANDOM_METHOD'
      },
      adminToken
    );
    assert(res19BadMethod.status === 400, '19b. Invalid registrationMethod is rejected (400)');

    // 20. Cancellation does NOT physically delete the Event document
    const res20Doc = await Event.findById(newEventId);
    assert(res20Doc !== null && res20Doc.status === EventStatus.CANCELLED, '20. Cancelled event document exists in database with status CANCELLED');

    // 21. Additional validation: invalid date and invalid ObjectId format
    const res21BadDate = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Bad Date Event',
        eventType: 'Demo',
        category: EventCategory.CLUB,
        clubId: club1._id.toString(),
        date: 'not-a-valid-date',
        startTime: '10:00 AM',
        endTime: '12:00 PM'
      },
      adminToken
    );
    assert(res21BadDate.status === 400, '21. Invalid date returns 400');

    const res22BadId = await apiRequest('GET', '/api/events/invalid-id-format', undefined, studentToken);
    assert(res22BadId.status === 400, '22. Invalid event ID format returns 400');

    // 23. President cannot create academic events
    const res23PresAcademic = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'Academic Exam Prep',
        eventType: 'Academic',
        category: EventCategory.ACADEMIC,
        date: '2026-12-05',
        startTime: '10:00 AM',
        endTime: '01:00 PM'
      },
      pres1Token
    );
    assert(res23PresAcademic.status === 403, '23. President cannot create ACADEMIC events (403)');

    console.log(`\n========================================`);
    console.log(`Event Tests Finished: ${passedTests}/${totalTests} Passed.`);
    console.log(`========================================\n`);
  } finally {
    await stopTestEnvironment();
  }
}

runTests().catch((err) => {
  console.error('[Event Tests FAILED]', err);
  process.exit(1);
});
