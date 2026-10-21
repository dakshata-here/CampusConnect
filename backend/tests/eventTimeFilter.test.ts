import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../src/models/Event.js';
import { generateToken } from '../src/utils/jwt.js';
import {
  parseTimeToHoursAndMinutes,
  formatToDateString,
  getEventEndDateTime,
  isEventPast,
  isEventActive
} from '../src/utils/eventTimeUtils.js';

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
  console.log('\n[Event Time Filter Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Event Time Filter Tests] In-memory MongoDB connected: ${uri}`);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect_time_test';
    await mongoose.connect(fallbackUri);
  }

  await User.deleteMany({});
  await Club.deleteMany({});
  await Venue.deleteMany({});
  await Event.deleteMany({});

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`[Event Time Filter Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Event Time Filter Tests] Tearing down test environment...');
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
    const payload = body ? JSON.stringify(body) : undefined;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
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

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('   CAMPUSCONNECT AUTOMATIC PAST-EVENT FILTER TESTS   ');
  console.log('======================================================');

  // ==========================================
  // UNIT TESTS: eventTimeUtils
  // ==========================================
  console.log('\n--- Section 1: eventTimeUtils Unit Verification ---');

  // 1. Time parsing (24h and 12h)
  const t1 = parseTimeToHoursAndMinutes('14:30');
  assert(t1?.hours === 14 && t1?.minutes === 30, 'Parses 24-hour time 14:30 correctly');

  const t2 = parseTimeToHoursAndMinutes('02:45 PM');
  assert(t2?.hours === 14 && t2?.minutes === 45, 'Parses 12-hour PM time 02:45 PM correctly');

  const t3 = parseTimeToHoursAndMinutes('12:15 AM');
  assert(t3?.hours === 0 && t3?.minutes === 15, 'Parses 12-hour AM midnight time 12:15 AM correctly');

  const t4 = parseTimeToHoursAndMinutes('invalid-time');
  assert(t4 === null, 'Returns null on invalid time string');

  // 2. formatToDateString
  const dStr = formatToDateString(new Date('2026-11-15T00:00:00.000Z'));
  assert(dStr === '2026-11-15', 'Extracts YYYY-MM-DD from Date without timezone corruption');

  // 3. getEventEndDateTime with exact endTime
  const endExact = getEventEndDateTime({
    date: '2026-10-21',
    endTime: '18:30'
  });
  assert(
    endExact?.getFullYear() === 2026 &&
    endExact?.getMonth() === 9 &&
    endExact?.getDate() === 21 &&
    endExact?.getHours() === 18 &&
    endExact?.getMinutes() === 30,
    'Calculates exact end Date for single-day event'
  );

  // 4. getEventEndDateTime fallback: missing or invalid endTime defaults to 23:59:59.999
  const endFallback = getEventEndDateTime({
    date: '2026-10-21',
    endTime: ''
  });
  assert(
    endFallback?.getHours() === 23 &&
    endFallback?.getMinutes() === 59 &&
    endFallback?.getSeconds() === 59,
    'Fallback rule: missing endTime safely defaults to 23:59:59.999 on event day'
  );

  // 5. getEventEndDateTime multi-day event: uses endDate
  const endMulti = getEventEndDateTime({
    date: '2026-10-20',
    endDate: '2026-10-24',
    endTime: '17:00'
  });
  assert(
    endMulti?.getDate() === 24 && endMulti?.getHours() === 17,
    'Multi-day event uses endDate and endTime for final expiration'
  );

  // 6. isEventPast: in-progress event (started 1h ago, ends 1h from now)
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const inProgressEvent = {
    date: formatDate(now),
    startTime: formatTime(oneHourAgo),
    endTime: formatTime(oneHourLater)
  };
  assert(!isEventPast(inProgressEvent, now), 'In-progress event is NOT considered past (remains active)');

  // 7. isEventPast: event ended 10 minutes ago
  const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const endedEvent = {
    date: formatDate(now),
    startTime: formatTime(twoHoursAgo),
    endTime: formatTime(tenMinsAgo)
  };
  assert(isEventPast(endedEvent, now), 'Event whose end time has passed is correctly identified as past');

  // 8. isEventPast: future upcoming event
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const futureEvent = {
    date: formatDate(tomorrow),
    startTime: '10:00',
    endTime: '12:00'
  };
  assert(!isEventPast(futureEvent, now), 'Upcoming future event is NOT past (active)');

  // 9. isEventPast: multi-day event currently in between start and end
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const multiDayOngoing = {
    date: formatDate(yesterday),
    endDate: formatDate(tomorrow),
    startTime: '09:00',
    endTime: '17:00'
  };
  assert(!isEventPast(multiDayOngoing, now), 'Multi-day event remains active until final end date and time');

  // 10. isEventPast: multi-day event that ended yesterday
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const multiDayEnded = {
    date: formatDate(twoDaysAgo),
    endDate: formatDate(yesterday),
    startTime: '09:00',
    endTime: '17:00'
  };
  assert(isEventPast(multiDayEnded, now), 'Multi-day event is past once its final end date has passed');

  // ==========================================
  // INTEGRATION TESTS: HTTP API & MongoDB
  // ==========================================
  console.log('\n--- Section 2: Backend API & MongoDB Integration Tests ---');
  await startTestEnvironment();

  // Setup Admin, Club President, Student, Club, Venue
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin.filter@college.edu',
    password: 'Password@123',
    role: UserRole.COLLEGE_ADMIN,
    status: 'active'
  });
  const adminToken = generateToken({ id: admin._id.toString(), role: admin.role, email: admin.email });

  const club = await Club.create({
    name: 'Coding Club',
    shortName: 'CC',
    category: ClubCategory.TECHNICAL,
    status: ClubStatus.ACTIVE
  });

  const president = await User.create({
    name: 'President Pat',
    email: 'pres.filter@college.edu',
    password: 'Password@123',
    role: UserRole.CLUB_PRESIDENT,
    clubId: club._id,
    status: 'active'
  });
  const presidentToken = generateToken({ id: president._id.toString(), role: president.role, email: president.email });

  const student = await User.create({
    name: 'Student Sam',
    email: 'sam.filter@college.edu',
    password: 'Password@123',
    role: UserRole.STUDENT,
    status: 'active'
  });
  const studentToken = generateToken({ id: student._id.toString(), role: student.role, email: student.email });

  const venue = await Venue.create({
    name: 'Auditorium 1',
    building: 'Main Block',
    floor: '1st',
    capacity: 200,
    operationalStatus: VenueOperationalStatus.OPERATIONAL
  });

  // Create Events with various timing relative to current time
  const testNow = new Date();
  const dateTodayStr = formatDate(testNow);
  const dateYesterdayStr = formatDate(new Date(testNow.getTime() - 24 * 60 * 60 * 1000));
  const dateTomorrowStr = formatDate(new Date(testNow.getTime() + 24 * 60 * 60 * 1000));
  const dateNextWeekStr = formatDate(new Date(testNow.getTime() + 7 * 24 * 60 * 60 * 1000));

  // Event 1: Future Upcoming Event
  const upcomingEvent = await Event.create({
    title: 'Future AI Seminar',
    eventType: 'Seminar',
    category: EventCategory.CLUB,
    clubId: club._id,
    venueId: venue._id,
    proposedBy: president._id,
    date: new Date(dateTomorrowStr),
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    registrationRequired: true,
    status: EventStatus.APPROVED
  });

  // Event 2: In-Progress Event (started 1 hr ago, ends in 2 hrs)
  const tStart = formatTime(new Date(testNow.getTime() - 60 * 60 * 1000));
  const tEnd = formatTime(new Date(testNow.getTime() + 2 * 60 * 60 * 1000));
  const inProgressEvt = await Event.create({
    title: 'Live Workshop Right Now',
    eventType: 'Workshop',
    category: EventCategory.CLUB,
    clubId: club._id,
    venueId: venue._id,
    proposedBy: president._id,
    date: new Date(dateTodayStr),
    startTime: tStart,
    endTime: tEnd,
    registrationRequired: true,
    status: EventStatus.APPROVED
  });

  // Event 3: Expired Earlier Today (ended 30 mins ago)
  const tPastStart = formatTime(new Date(testNow.getTime() - 3 * 60 * 60 * 1000));
  const tPastEnd = formatTime(new Date(testNow.getTime() - 30 * 60 * 1000));
  const expiredTodayEvt = await Event.create({
    title: 'Morning Breakfast Session (Ended)',
    eventType: 'Seminar',
    category: EventCategory.CLUB,
    clubId: club._id,
    venueId: venue._id,
    proposedBy: president._id,
    date: new Date(dateTodayStr),
    startTime: tPastStart,
    endTime: tPastEnd,
    registrationRequired: true,
    status: EventStatus.APPROVED
  });

  // Event 4: Past Event From Yesterday
  const pastYesterdayEvt = await Event.create({
    title: 'Yesterday Tech Talk',
    eventType: 'Seminar',
    category: EventCategory.CLUB,
    clubId: club._id,
    venueId: venue._id,
    proposedBy: president._id,
    date: new Date(dateYesterdayStr),
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    registrationRequired: true,
    status: EventStatus.APPROVED
  });

  // Event 5: Multi-Day Ongoing Event (started yesterday, ends tomorrow)
  const multiDayOngoingEvt = await Event.create({
    title: '48-Hour National Hackathon',
    eventType: 'Hackathon',
    category: EventCategory.CLUB,
    clubId: club._id,
    venueId: venue._id,
    proposedBy: president._id,
    date: new Date(dateYesterdayStr),
    endDate: new Date(dateTomorrowStr),
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    registrationRequired: true,
    status: EventStatus.APPROVED
  });

  // Event 6: Multi-Day Ended Event (started 3 days ago, ended yesterday)
  const dateThreeDaysAgoStr = formatDate(new Date(testNow.getTime() - 72 * 60 * 60 * 1000));
  const multiDayEndedEvt = await Event.create({
    title: 'Last Weekend Design Sprint',
    eventType: 'Workshop',
    category: EventCategory.CLUB,
    clubId: club._id,
    venueId: venue._id,
    proposedBy: president._id,
    date: new Date(dateThreeDaysAgoStr),
    endDate: new Date(dateYesterdayStr),
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    registrationRequired: true,
    status: EventStatus.APPROVED
  });

  // Event 7: Event today with missing/fallback endTime (should remain visible today)
  const fallbackTimeEvt = await Event.create({
    title: 'Campus Open Day (All Day)',
    eventType: 'Academic',
    category: EventCategory.ACADEMIC,
    venueId: venue._id,
    proposedBy: admin._id,
    date: new Date(dateTodayStr),
    startTime: '08:00 AM',
    endTime: '23:59', // Will remain active until 23:59:59
    registrationRequired: false,
    status: EventStatus.APPROVED
  });

  // Verification 1: GET /api/events default (Active events only)
  const resActive = await apiRequest('GET', '/api/events', null, studentToken);
  assert(resActive.status === 200, 'GET /api/events returns 200 OK');
  const activeIds = resActive.body.events.map((e: any) => e.id || e._id);

  assert(activeIds.includes(upcomingEvent.id), 'Test 1 Passed: Upcoming event is displayed in active list');
  assert(activeIds.includes(inProgressEvt.id), 'Test 2 Passed: In-progress event remains displayed in active list');
  assert(!activeIds.includes(expiredTodayEvt.id), 'Test 3 Passed: Event ended earlier today is automatically hidden');
  assert(!activeIds.includes(pastYesterdayEvt.id), 'Test 3b Passed: Event ended yesterday is automatically hidden');
  assert(activeIds.includes(multiDayOngoingEvt.id), 'Test 4 Passed: Multi-day ongoing event remains visible until final end date');
  assert(!activeIds.includes(multiDayEndedEvt.id), 'Test 4b Passed: Multi-day event that ended is automatically hidden');
  assert(activeIds.includes(fallbackTimeEvt.id), 'Test 9 Passed: Event today with safe fallback remains active today');

  // Verification 5: Past events remain safely stored in MongoDB
  const totalDbCount = await Event.countDocuments({});
  assert(totalDbCount === 7, 'Test 5 Passed: All 7 events remain permanently preserved in MongoDB (no deletion)');

  // Verification 6: GET /api/events?includePast=true returns all historical events
  const resHistorical = await apiRequest('GET', '/api/events?includePast=true', null, adminToken);
  assert(resHistorical.status === 200, 'GET /api/events?includePast=true returns 200 OK');
  assert(resHistorical.body.count === 7, 'Test 6 Passed: includePast=true returns full history for administrative audit/reporting');

  // Verification 7: Prevent student registration for past events
  const resRegPast = await apiRequest(
    'POST',
    `/api/registrations/events/${pastYesterdayEvt.id}`,
    {},
    studentToken
  );
  assert(resRegPast.status === 400, 'Test 7 Passed: Attempting to register for past event returns HTTP 400');
  assert(
    resRegPast.body.message.includes('ended') || resRegPast.body.message.includes('past'),
    'Registration error message explains event has already ended'
  );

  // Verification 8: Successful registration for active upcoming event
  const resRegFuture = await apiRequest(
    'POST',
    `/api/registrations/events/${upcomingEvent.id}`,
    {},
    studentToken
  );
  assert(resRegFuture.status === 201, 'Test 8 Passed: Registering for active upcoming event succeeds with 201 Created');

  // Verification 9: POST /api/events with endDate supports multi-day event creation
  const venue2 = await Venue.create({
    name: 'Seminar Hall 2',
    building: 'Tech Block',
    floor: '2nd',
    capacity: 100,
    operationalStatus: VenueOperationalStatus.OPERATIONAL
  });

  const resCreateMulti = await apiRequest(
    'POST',
    '/api/events',
    {
      title: 'Robotics Summer Camp',
      eventType: 'Workshop',
      category: 'CLUB',
      clubId: club._id.toString(),
      venueId: venue2._id.toString(),
      date: dateTomorrowStr,
      endDate: dateNextWeekStr,
      startTime: '09:00 AM',
      endTime: '04:00 PM',
      registrationRequired: true,
      status: 'APPROVED'
    },
    adminToken
  );
  if (resCreateMulti.status !== 201) {
    console.error('resCreateMulti failed:', resCreateMulti.status, resCreateMulti.body);
  }
  assert(resCreateMulti.status === 201, 'Test 9 Passed: Multi-day event created successfully with endDate', resCreateMulti.body);
  assert(resCreateMulti.body.event.endDate !== null, 'Created event contains persisted endDate');

  await stopTestEnvironment();

  console.log('\n======================================================');
  console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
  console.log('======================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
