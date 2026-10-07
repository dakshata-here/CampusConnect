import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../src/models/Event.js';
import { checkVenueConflict } from '../src/utils/venueConflict.js';
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
  console.log('\n[Module 6 Venue & Conflict Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Venue Tests] In-memory MongoDB connected: ${uri}`);
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
      console.log(`[Venue Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Venue Tests] Tearing down test environment...');
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

    console.log('\n--- Setting up base Users, Club, and Venues ---');

    // Admin user
    const adminUser = await User.create({
      name: 'Campus Admin',
      email: 'admin.venue@college.edu',
      password: 'AdminPassword@123',
      role: UserRole.COLLEGE_ADMIN,
      enrollmentNumber: 'ADM-VENUE-01',
      department: 'Administration',
      status: 'active'
    });
    const adminToken = generateToken({
      id: adminUser._id.toString(),
      role: adminUser.role,
      email: adminUser.email
    });

    // President user
    const presUser = await User.create({
      name: 'President Jane',
      email: 'pres.venue@college.edu',
      password: 'President@123',
      role: UserRole.CLUB_PRESIDENT,
      enrollmentNumber: 'PRES-VENUE-01',
      department: 'Computer Science',
      status: 'active'
    });
    const presToken = generateToken({
      id: presUser._id.toString(),
      role: presUser.role,
      email: presUser.email
    });

    // Student user
    const studentUser = await User.create({
      name: 'Student Bob',
      email: 'student.venue@college.edu',
      password: 'Student@123',
      role: UserRole.STUDENT,
      enrollmentNumber: 'STU-VENUE-01',
      department: 'Computer Science',
      status: 'active'
    });
    const studentToken = generateToken({
      id: studentUser._id.toString(),
      role: studentUser.role,
      email: studentUser.email
    });

    // Club
    const techClub = await Club.create({
      name: 'Robotics Club',
      shortName: 'ROBO',
      description: 'Official Robotics Club',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    // Club membership for president
    await ClubMembership.create({
      clubId: techClub._id,
      userId: presUser._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Club President',
      isActive: true
    });

    // ------------------------------------------------------------------------
    // 1. VENUE CRUD & RBAC
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Venue CRUD & RBAC ---');

    // 1. Unauthenticated cannot list venues
    const res1 = await apiRequest('GET', '/api/venues');
    assert(res1.status === 401, '1. Unauthenticated cannot access venues (401)');

    // 2. Student cannot create venue
    const res2 = await apiRequest(
      'POST',
      '/api/venues',
      {
        name: 'Hacked Auditorium',
        building: 'Block X',
        capacity: 100
      },
      studentToken
    );
    assert(res2.status === 403, '2. Student cannot create venue (403)');

    // 3. President cannot create venue
    const res3 = await apiRequest(
      'POST',
      '/api/venues',
      {
        name: 'President Lounge',
        building: 'Block Y',
        capacity: 50
      },
      presToken
    );
    assert(res3.status === 403, '3. President cannot create venue (403)');

    // 4. Admin creates Venue 1 (Auditorium)
    const res4 = await apiRequest(
      'POST',
      '/api/venues',
      {
        name: 'Main Auditorium (A-Block)',
        building: 'Dr. APJ Abdul Kalam Block',
        floor: 'Ground Floor',
        capacity: 800,
        facilities: ['Dual 4K Projectors', 'Dolby Surround PA', 'Air Conditioning'],
        isAvailable: true,
        operationalStatus: VenueOperationalStatus.OPERATIONAL
      },
      adminToken
    );
    assert(res4.status === 201 && res4.body.venue.name === 'Main Auditorium (A-Block)', '4. Admin creates venue successfully (201)');
    const auditoriumId = res4.body.venue.id;

    // 5. Duplicate venue name rejected
    const res5 = await apiRequest(
      'POST',
      '/api/venues',
      {
        name: 'Main Auditorium (A-Block)',
        building: 'Different Block',
        capacity: 500
      },
      adminToken
    );
    assert(res5.status === 409, '5. Duplicate venue name rejected (409)');

    // 6. Admin creates Venue 2 (Seminar Hall)
    const res6 = await apiRequest(
      'POST',
      '/api/venues',
      {
        name: 'Seminar Hall 1',
        building: 'IT Wing (F-Block)',
        floor: '2nd Floor',
        capacity: 120,
        facilities: ['Laser Projector', 'Mic'],
        isAvailable: true,
        operationalStatus: VenueOperationalStatus.OPERATIONAL
      },
      adminToken
    );
    assert(res6.status === 201, '6. Admin creates second venue (201)');
    const seminarHallId = res6.body.venue.id;

    // 7. Admin creates Venue 3 (Lab under maintenance)
    const res7 = await apiRequest(
      'POST',
      '/api/venues',
      {
        name: 'AI Research Lab',
        building: 'Computer Dept',
        floor: '4th Floor',
        capacity: 50,
        facilities: ['GPU Nodes'],
        isAvailable: true,
        operationalStatus: VenueOperationalStatus.MAINTENANCE
      },
      adminToken
    );
    assert(res7.status === 201, '7. Admin creates venue under maintenance (201)');
    const labId = res7.body.venue.id;

    // 8. Admin creates Venue 4 (Unavailable Room)
    const res8 = await apiRequest(
      'POST',
      '/api/venues',
      {
        name: 'Executive Boardroom',
        building: 'Admin Block',
        floor: '3rd Floor',
        capacity: 25,
        isAvailable: false,
        operationalStatus: VenueOperationalStatus.OPERATIONAL
      },
      adminToken
    );
    assert(res8.status === 201, '8. Admin creates unavailable venue (201)');
    const boardroomId = res8.body.venue.id;

    // 9. Student can list all venues
    const res9 = await apiRequest('GET', '/api/venues', undefined, studentToken);
    assert(res9.status === 200 && res9.body.count === 4, '9. Student can list venues (200, count 4)');

    // 10. Filter venues by search
    const res10 = await apiRequest('GET', '/api/venues?search=Auditorium', undefined, studentToken);
    assert(res10.status === 200 && res10.body.count === 1 && res10.body.venues[0].name.includes('Auditorium'), '10. Search filter works (200)');

    // 11. Filter venues by minCapacity
    const res11 = await apiRequest('GET', '/api/venues?minCapacity=500', undefined, studentToken);
    assert(res11.status === 200 && res11.body.count === 1 && res11.body.venues[0].capacity >= 500, '11. minCapacity filter works (200)');

    // 12. Filter venues by operationalStatus
    const res12 = await apiRequest('GET', '/api/venues?operationalStatus=MAINTENANCE', undefined, studentToken);
    assert(res12.status === 200 && res12.body.count === 1 && res12.body.venues[0].id === labId, '12. operationalStatus filter works (200)');

    // 13. Get single venue by ID
    const res13 = await apiRequest('GET', `/api/venues/${auditoriumId}`, undefined, studentToken);
    assert(res13.status === 200 && res13.body.venue.name === 'Main Auditorium (A-Block)', '13. Get venue by ID (200)');

    // 14. Admin updates venue details
    const res14 = await apiRequest(
      'PUT',
      `/api/venues/${seminarHallId}`,
      {
        capacity: 150,
        floor: '3rd Floor'
      },
      adminToken
    );
    assert(res14.status === 200 && res14.body.venue.capacity === 150, '14. Admin updates venue capacity (200)');

    // 15. Admin updates venue status
    const res15 = await apiRequest(
      'PATCH',
      `/api/venues/${labId}/status`,
      {
        operationalStatus: VenueOperationalStatus.OPERATIONAL
      },
      adminToken
    );
    assert(res15.status === 200 && res15.body.venue.operationalStatus === VenueOperationalStatus.OPERATIONAL, '15. Admin patches venue status to OPERATIONAL (200)');

    // ------------------------------------------------------------------------
    // 2. CONFLICT CHECK ENDPOINT (POST /api/venues/check-conflict)
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Conflict Check Endpoint & Utility ---');

    // 16. Check conflict on unavailable venue
    const res16 = await apiRequest(
      'POST',
      '/api/venues/check-conflict',
      {
        venueId: boardroomId,
        date: '2026-11-15',
        startTime: '10:00 AM',
        endTime: '12:00 PM'
      },
      presToken
    );
    assert(res16.status === 200 && res16.body.hasConflict === true && res16.body.type === 'VENUE_UNAVAILABLE', '16. Unavailable venue flags conflict (type: VENUE_UNAVAILABLE)');

    // 17. Check conflict when maxParticipants exceeds venue capacity
    const res17 = await apiRequest(
      'POST',
      '/api/venues/check-conflict',
      {
        venueId: seminarHallId, // Capacity 150
        date: '2026-11-15',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        maxParticipants: 300
      },
      presToken
    );
    assert(res17.status === 200 && res17.body.hasConflict === true && res17.body.type === 'CAPACITY_EXCEEDED', '17. Capacity exceeded flags conflict (type: CAPACITY_EXCEEDED)');

    // 18. Create an approved event on Main Auditorium
    const approvedEvent = await Event.create({
      title: 'RoboWars Grand Finals',
      eventType: 'Competition',
      category: EventCategory.CLUB,
      clubId: techClub._id,
      venueId: new mongoose.Types.ObjectId(auditoriumId),
      proposedBy: presUser._id,
      date: new Date('2026-11-20'),
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      status: EventStatus.APPROVED
    });

    // 19. Check conflict for overlapping time on same date
    const res19 = await apiRequest(
      'POST',
      '/api/venues/check-conflict',
      {
        venueId: auditoriumId,
        date: '2026-11-20',
        startTime: '11:30 AM',
        endTime: '02:30 PM'
      },
      presToken
    );
    assert(res19.status === 200 && res19.body.hasConflict === true && res19.body.type === 'TIME_CLASH', '19. Overlapping time on same date flags TIME_CLASH');
    assert(res19.body.conflictingEvent?.id === approvedEvent._id.toString(), '19b. Conflicting event details returned');

    // 20. Check conflict for non-overlapping time on same date (2:00 PM - 5:00 PM)
    const res20 = await apiRequest(
      'POST',
      '/api/venues/check-conflict',
      {
        venueId: auditoriumId,
        date: '2026-11-20',
        startTime: '02:00 PM',
        endTime: '05:00 PM'
      },
      presToken
    );
    assert(res20.status === 200 && res20.body.hasConflict === false, '20. Non-overlapping time slot reports no conflict (hasConflict: false)');

    // 21. Check conflict on different date
    const res21 = await apiRequest(
      'POST',
      '/api/venues/check-conflict',
      {
        venueId: auditoriumId,
        date: '2026-11-21',
        startTime: '10:00 AM',
        endTime: '01:00 PM'
      },
      presToken
    );
    assert(res21.status === 200 && res21.body.hasConflict === false, '21. Different date reports no conflict (hasConflict: false)');

    // 22. Exclude event ID ignores self-conflict
    const res22 = await apiRequest(
      'POST',
      '/api/venues/check-conflict',
      {
        venueId: auditoriumId,
        date: '2026-11-20',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        excludeEventId: approvedEvent._id.toString()
      },
      presToken
    );
    assert(res22.status === 200 && res22.body.hasConflict === false, '22. excludeEventId avoids self-conflict');

    // 23. Direct checkVenueConflict utility verification for maintenance status
    await Venue.findByIdAndUpdate(labId, { operationalStatus: VenueOperationalStatus.MAINTENANCE });
    const directMaintenanceCheck = await checkVenueConflict({
      venueId: labId,
      date: '2026-11-20',
      startTime: '10:00 AM',
      endTime: '12:00 PM'
    });
    assert(directMaintenanceCheck.hasConflict === true && directMaintenanceCheck.type === 'VENUE_MAINTENANCE', '23. checkVenueConflict detects VENUE_MAINTENANCE');

    // 24. Direct checkVenueConflict utility verification for non-existent venue
    const directNotFoundCheck = await checkVenueConflict({
      venueId: new mongoose.Types.ObjectId(),
      date: '2026-11-20',
      startTime: '10:00 AM',
      endTime: '12:00 PM'
    });
    assert(directNotFoundCheck.hasConflict === true && directNotFoundCheck.type === 'NOT_FOUND', '24. checkVenueConflict detects NOT_FOUND');

    // 25. Check pending events flag
    const pendingEvent = await Event.create({
      title: 'Pending Tech Talk',
      eventType: 'Talk',
      category: EventCategory.CLUB,
      clubId: techClub._id,
      venueId: new mongoose.Types.ObjectId(auditoriumId),
      proposedBy: presUser._id,
      date: new Date('2026-11-20'),
      startTime: '06:00 PM',
      endTime: '08:00 PM',
      status: EventStatus.PENDING_APPROVAL
    });

    const pendingConflictCheck = await checkVenueConflict({
      venueId: auditoriumId,
      date: '2026-11-20',
      startTime: '06:30 PM',
      endTime: '07:30 PM',
      checkPending: true
    });
    assert(pendingConflictCheck.hasConflict === true && pendingConflictCheck.type === 'TIME_CLASH', '25. checkVenueConflict flags clash with pending event when checkPending is true');

    // ------------------------------------------------------------------------
    // 3. VENUE SCHEDULE / TIMETABLE API
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Venue Schedule / Timetable API ---');

    // 26. Get schedule for Auditorium on 2026-11-20
    const res26 = await apiRequest('GET', `/api/venues/${auditoriumId}/schedule?date=2026-11-20`, undefined, studentToken);
    assert(res26.status === 200 && res26.body.count >= 2, '26. Venue schedule returns bookings for the day (200, count >= 2)');
    assert(Array.isArray(res26.body.bookings), '26b. Bookings array present with event time slots');

    // 27. Get schedule on an empty date
    const res27 = await apiRequest('GET', `/api/venues/${auditoriumId}/schedule?date=2026-12-25`, undefined, studentToken);
    assert(res27.status === 200 && res27.body.count === 0, '27. Schedule for free date returns 0 bookings');

    // ------------------------------------------------------------------------
    // 4. VENUE DELETION SAFETY CHECKS
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Venue Deletion Safety Checks ---');

    // 28. Cannot delete venue with scheduled approved events
    const res28 = await apiRequest('DELETE', `/api/venues/${auditoriumId}`, undefined, adminToken);
    assert(res28.status === 400 && res28.body.message.includes('upcoming approved event'), '28. Deletion of booked venue rejected (400)');

    // 29. Free venue can be deleted
    const freeVenue = await Venue.create({
      name: 'Temporary Classroom 99',
      building: 'Temp Shed',
      capacity: 30,
      isAvailable: true
    });
    const res29 = await apiRequest('DELETE', `/api/venues/${freeVenue._id}`, undefined, adminToken);
    assert(res29.status === 200 && res29.body.success === true, '29. Free venue deleted successfully (200)');

    console.log(`\n========================================`);
    console.log(`Module 6 Venue Tests: ${passedTests}/${totalTests} Passed.`);
    console.log(`========================================\n`);
  } finally {
    await stopTestEnvironment();
  }
}

runTests().catch((err) => {
  console.error('[Venue Tests FAILED]', err);
  process.exit(1);
});
