import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../src/models/Event.js';
import { Approval, ApprovalAction } from '../src/models/Approval.js';
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
  console.log('\n[E2E System Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[E2E System Tests] In-memory MongoDB connected: ${uri}`);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect_test';
    await mongoose.connect(fallbackUri);
  }

  await User.deleteMany({});
  await Club.deleteMany({});
  await ClubMembership.deleteMany({});
  await Venue.deleteMany({});
  await Event.deleteMany({});
  await Approval.deleteMany({});

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`[E2E System Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[E2E System Tests] Tearing down test environment...');
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
// Complete E2E Integration Test Suite
// ----------------------------------------------------
async function runE2ETests() {
  await startTestEnvironment();

  try {
    console.log('\n=========================================');
    console.log(' SCENARIO 1: SYSTEM SETUP & VENUE CREATION');
    console.log('=========================================');

    // Create shared venue
    const auditorium = await Venue.create({
      name: 'Central Convention Center',
      building: 'Main Campus Building',
      floor: 'Ground Floor',
      capacity: 1000,
      facilities: ['A/V System', 'High-Speed WiFi', 'Air Conditioning'],
      isAvailable: true,
      operationalStatus: VenueOperationalStatus.OPERATIONAL
    });
    assert(auditorium !== null, '1. Venue created successfully');

    console.log('\n=========================================');
    console.log(' SCENARIO 2: STUDENT END-TO-END FLOW');
    console.log('=========================================');

    // 2.1 Student registration
    const regRes = await apiRequest('POST', '/api/auth/register', {
      name: 'Tanvi Deshmukh',
      email: 'tanvi.student@college.edu',
      password: 'Password@123',
      role: 'student',
      department: 'Computer Engineering',
      enrollmentNumber: 'C2K2410088'
    });
    assert(regRes.status === 201 && regRes.body.success === true, '2.1 Student registers via /api/auth/register (201)');
    const studentToken = regRes.body.token;
    const studentId = regRes.body.user.id;

    // 2.2 Student login
    const loginRes = await apiRequest('POST', '/api/auth/login', {
      email: 'tanvi.student@college.edu',
      password: 'Password@123'
    });
    assert(loginRes.status === 200 && loginRes.body.token, '2.2 Student logs in via /api/auth/login (200)');

    // 2.3 Student profile retrieval & update
    const profileRes = await apiRequest('GET', '/api/users/profile', undefined, studentToken);
    assert(profileRes.status === 200 && profileRes.body.user.name === 'Tanvi Deshmukh', '2.3 Student retrieves own profile (200)');

    const updateProfileRes = await apiRequest(
      'PUT',
      '/api/users/profile',
      { bio: 'Passionate about Web3 and AI', phone: '9822001122' },
      studentToken
    );
    assert(updateProfileRes.status === 200 && updateProfileRes.body.user.bio === 'Passionate about Web3 and AI', '2.4 Student updates profile (200)');

    // 2.5 Student cannot access admin list of all users
    const allUsersRes = await apiRequest('GET', '/api/users', undefined, studentToken);
    assert(allUsersRes.status === 403, '2.5 Student is DENIED admin user list (403)');

    console.log('\n=========================================');
    console.log(' SCENARIO 3: ADMIN & CLUB MANAGEMENT FLOW');
    console.log('=========================================');

    // 3.1 Admin registration & login
    const adminUser = await User.create({
      name: 'College Dean Admin',
      email: 'dean.admin@college.edu',
      password: 'Password@123',
      role: UserRole.COLLEGE_ADMIN,
      department: 'Dean Office',
      collegeUid: 'DEAN001'
    });
    const adminToken = generateToken({
      id: (adminUser._id as any).toString(),
      role: adminUser.role,
      email: adminUser.email
    });

    // 3.2 Admin creates Club A (IEEE) and Club B (ACM)
    const clubARes = await apiRequest(
      'POST',
      '/api/clubs',
      {
        name: 'IEEE Student Branch',
        shortName: 'IEEE',
        description: 'Advancing Technology for Humanity',
        category: ClubCategory.TECHNICAL,
        status: ClubStatus.ACTIVE
      },
      adminToken
    );
    assert(clubARes.status === 201 && clubARes.body.club.name === 'IEEE Student Branch', '3.2 Admin creates Club A (201)');
    const clubAId = clubARes.body.club.id;

    const clubBRes = await apiRequest(
      'POST',
      '/api/clubs',
      {
        name: 'ACM Student Chapter',
        shortName: 'ACM',
        description: 'Computing Machinery & Algorithms',
        category: ClubCategory.TECHNICAL,
        status: ClubStatus.ACTIVE
      },
      adminToken
    );
    assert(clubBRes.status === 201 && clubBRes.body.club.name === 'ACM Student Chapter', '3.3 Admin creates Club B (201)');
    const clubBId = clubBRes.body.club.id;

    // 3.4 Admin updates club metadata and status
    const updateClubRes = await apiRequest(
      'PUT',
      `/api/clubs/${clubAId}`,
      { description: 'Official IEEE Student Branch — Updated' },
      adminToken
    );
    assert(updateClubRes.status === 200 && updateClubRes.body.club.description === 'Official IEEE Student Branch — Updated', '3.4 Admin updates club details (200)');

    console.log('\n=========================================');
    console.log(' SCENARIO 4: CLUB LEADERSHIP & CROSS-CLUB ISOLATION');
    console.log('=========================================');

    // 4.1 Create President A and President B
    const presAUser = await User.create({
      name: 'Aarav President IEEE',
      email: 'aarav.ieee@college.edu',
      password: 'Password@123',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Computer Science',
      collegeUid: 'PRES_A'
    });
    const presAToken = generateToken({
      id: (presAUser._id as any).toString(),
      role: presAUser.role,
      email: presAUser.email
    });

    const presBUser = await User.create({
      name: 'Bhavna President ACM',
      email: 'bhavna.acm@college.edu',
      password: 'Password@123',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Information Technology',
      collegeUid: 'PRES_B'
    });
    const presBToken = generateToken({
      id: (presBUser._id as any).toString(),
      role: presBUser.role,
      email: presBUser.email
    });

    // 4.2 Assign President A as LEAD of Club A and President B as LEAD of Club B
    const assignLeadARes = await apiRequest(
      'POST',
      `/api/clubs/${clubAId}/members`,
      {
        userId: presAUser._id.toString(),
        role: ClubMembershipRole.LEAD,
        designation: 'Chairperson'
      },
      adminToken
    );
    assert(assignLeadARes.status === 201 && assignLeadARes.body.membership.role === 'LEAD', '4.2 President A assigned active LEAD of Club A (201)');

    const assignLeadBRes = await apiRequest(
      'POST',
      `/api/clubs/${clubBId}/members`,
      {
        userId: presBUser._id.toString(),
        role: ClubMembershipRole.LEAD,
        designation: 'Chairperson'
      },
      adminToken
    );
    assert(assignLeadBRes.status === 201 && assignLeadBRes.body.membership.role === 'LEAD', '4.3 President B assigned active LEAD of Club B (201)');

    // 4.4 President A adds Tanvi (Student) as Member to Club A
    const addMemberRes = await apiRequest(
      'POST',
      `/api/clubs/${clubAId}/members`,
      {
        userId: studentId,
        role: ClubMembershipRole.MEMBER,
        designation: 'Documentation Lead'
      },
      presAToken
    );
    assert(addMemberRes.status === 201, '4.4 President A adds student member to Club A (201)');

    // 4.5 Cross-Club Isolation: President A CANNOT add members to Club B
    const illegalAddRes = await apiRequest(
      'POST',
      `/api/clubs/${clubBId}/members`,
      {
        userId: studentId,
        role: ClubMembershipRole.MEMBER
      },
      presAToken
    );
    assert(illegalAddRes.status === 403, '4.5 President A is DENIED adding members to Club B (403)');

    console.log('\n=========================================');
    console.log(' SCENARIO 5: COMPLETE EVENT LIFECYCLE & AUDIT');
    console.log('=========================================');

    // 5.1 President A creates Club A event (enters PENDING_APPROVAL)
    const createEventRes = await apiRequest(
      'POST',
      '/api/events',
      {
        title: 'IEEE HackMatrix 2026',
        eventType: 'Hackathon',
        category: EventCategory.CLUB,
        clubId: clubAId,
        venueId: auditorium._id.toString(),
        date: '2026-11-15',
        startTime: '08:00 AM',
        endTime: '08:00 PM',
        shortDescription: 'Flagship 12-hour hackathon',
        maxParticipants: 200,
        registrationRequired: true,
        registrationMethod: RegistrationMethod.CAMPUSCONNECT,
        status: EventStatus.PENDING_APPROVAL
      },
      presAToken
    );
    assert(createEventRes.status === 201 && createEventRes.body.event.status === EventStatus.PENDING_APPROVAL, '5.1 President A creates event in PENDING_APPROVAL (201)');
    const eventAId = createEventRes.body.event.id;

    // 5.2 Verify proposedBy is strictly assigned from authenticated President A
    assert(createEventRes.body.event.proposedBy === presAUser._id.toString(), '5.2 Event proposedBy is strictly President A ID');

    // 5.3 President B CANNOT update or cancel Club A event
    const presBUpdateRes = await apiRequest('PUT', `/api/events/${eventAId}`, { title: 'ACM Hijack' }, presBToken);
    assert(presBUpdateRes.status === 403, "5.3 President B CANNOT update Club A's event (403)");

    const presBCancelRes = await apiRequest('PATCH', `/api/events/${eventAId}/cancel`, { reason: 'Cancel' }, presBToken);
    assert(presBCancelRes.status === 403, "5.4 President B CANNOT cancel Club A's event (403)");

    // 5.5 President A CANNOT approve their own event (admin only)
    const selfApproveRes = await apiRequest('PATCH', `/api/events/${eventAId}/approve`, {}, presAToken);
    assert(selfApproveRes.status === 403, '5.5 President A is DENIED self-approval (403)');

    // 5.6 Admin requests changes on event
    const reqChangesRes = await apiRequest(
      'PATCH',
      `/api/events/${eventAId}/request-changes`,
      { comments: 'Please reduce max participants to 150 to respect safety norms.' },
      adminToken
    );
    assert(reqChangesRes.status === 200 && reqChangesRes.body.event.status === EventStatus.CHANGES_REQUESTED, '5.6 Admin requests changes -> CHANGES_REQUESTED (200)');

    // 5.7 President A updates event to comply with requested changes
    const updateEventRes = await apiRequest(
      'PUT',
      `/api/events/${eventAId}`,
      { maxParticipants: 150, status: EventStatus.PENDING_APPROVAL },
      presAToken
    );
    assert(updateEventRes.status === 200 && updateEventRes.body.event.maxParticipants === 150, '5.7 President A updates participants to 150 (200)');

    // 5.8 Admin reviews and approves event
    const approveRes = await apiRequest(
      'PATCH',
      `/api/events/${eventAId}/approve`,
      { comments: 'Capacity verified with campus security. Approved.' },
      adminToken
    );
    assert(approveRes.status === 200 && approveRes.body.event.status === EventStatus.APPROVED, '5.8 Admin approves event -> APPROVED (200)');

    // 5.9 Check complete approval history audit trail
    const auditRes = await apiRequest('GET', `/api/events/${eventAId}/approvals`, undefined, studentToken);
    assert(auditRes.status === 200 && auditRes.body.count === 2, '5.9 Approval audit history contains 2 review steps (200)');
    assert(auditRes.body.approvals[0].action === ApprovalAction.APPROVED, '5.10 Latest action is APPROVED');
    assert(auditRes.body.approvals[1].action === ApprovalAction.CHANGES_REQUESTED, '5.11 Previous action is CHANGES_REQUESTED');

    // 5.10 Cancellation: President A can cancel approved event
    const cancelRes = await apiRequest(
      'PATCH',
      `/api/events/${eventAId}/cancel`,
      { reason: 'Severe weather alert' },
      presAToken
    );
    assert(cancelRes.status === 200 && cancelRes.body.event.status === EventStatus.CANCELLED, '5.12 President A cancels event -> CANCELLED (200)');

    // 5.13 Cannot approve a CANCELLED event
    const reApproveRes = await apiRequest('PATCH', `/api/events/${eventAId}/approve`, {}, adminToken);
    assert(reApproveRes.status === 400, '5.13 Cannot approve CANCELLED event (400)');

    console.log(`\n========================================`);
    console.log(`E2E System Tests Finished: ${passedTests}/${totalTests} Passed.`);
    console.log(`========================================\n`);
  } finally {
    await stopTestEnvironment();
  }
}

runE2ETests().catch((err) => {
  console.error('[E2E System Tests FAILED]', err);
  process.exit(1);
});
