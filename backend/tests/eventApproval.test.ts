import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus } from '../src/models/Event.js';
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
  console.log('\n[Event Approval Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Event Approval Tests] In-memory MongoDB connected: ${uri}`);
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
      console.log(`[Event Approval Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Event Approval Tests] Tearing down test environment...');
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
    // SETUP TEST USERS & BASE DATA
    // ------------------------------------------------------------------------
    console.log('\n--- Setting up base Users, Club, Venue, and Events ---');

    // 1. College Admin
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin.approval@campusconnect.edu',
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

    // 2. Club President
    const presidentUser = await User.create({
      name: 'President One',
      email: 'pres.approval@campusconnect.edu',
      password: 'Password123!',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Computer Science',
      collegeUid: 'PRES001'
    });
    const presToken = generateToken({
      id: (presidentUser._id as any).toString(),
      role: presidentUser.role,
      email: presidentUser.email
    });

    // 3. Student
    const studentUser = await User.create({
      name: 'Student One',
      email: 'student.approval@campusconnect.edu',
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

    // Club
    const techClub = await Club.create({
      name: 'Tech Innovators Club',
      shortName: 'TIC',
      description: 'Innovation & Tech Club',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    // Membership: President is active LEAD
    await ClubMembership.create({
      clubId: techClub._id,
      userId: presidentUser._id,
      role: ClubMembershipRole.LEAD,
      designation: 'President',
      isActive: true
    });

    // Venue
    const seminarHall = await Venue.create({
      name: 'Seminar Hall 1',
      building: 'Block B',
      floor: '2nd Floor',
      capacity: 150,
      facilities: ['Projector', 'Air Conditioner'],
      isAvailable: true,
      operationalStatus: VenueOperationalStatus.OPERATIONAL
    });

    // Helper to create test events
    const createTestEvent = async (title: string, status: EventStatus = EventStatus.PENDING_APPROVAL) => {
      return Event.create({
        title,
        eventType: 'Workshop',
        category: EventCategory.CLUB,
        clubId: techClub._id,
        venueId: seminarHall._id,
        proposedBy: presidentUser._id,
        date: new Date('2026-11-20'),
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        status
      });
    };

    // ------------------------------------------------------------------------
    // 1. AUTHORIZATION TESTS
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Authorization: Admin vs President/Student/Unauthenticated ---');

    const pendingEvent1 = await createTestEvent('Pending Event 1', EventStatus.PENDING_APPROVAL);

    // 1. Unauthenticated user cannot approve
    const res1 = await apiRequest('PATCH', `/api/events/${pendingEvent1._id}/approve`, { comments: 'Looks good' });
    assert(res1.status === 401, '1. Unauthenticated user cannot approve (401)');

    // 2. Student cannot approve
    const res2 = await apiRequest('PATCH', `/api/events/${pendingEvent1._id}/approve`, { comments: 'Looks good' }, studentToken);
    assert(res2.status === 403, '2. Student cannot approve (403)');

    // 3. President cannot approve
    const res3 = await apiRequest('PATCH', `/api/events/${pendingEvent1._id}/approve`, { comments: 'Looks good' }, presToken);
    assert(res3.status === 403, '3. President cannot approve (403)');

    // 4. Student cannot reject
    const res4 = await apiRequest('PATCH', `/api/events/${pendingEvent1._id}/reject`, { reason: 'No' }, studentToken);
    assert(res4.status === 403, '4. Student cannot reject (403)');

    // 5. President cannot reject
    const res5 = await apiRequest('PATCH', `/api/events/${pendingEvent1._id}/reject`, { reason: 'No' }, presToken);
    assert(res5.status === 403, '5. President cannot reject (403)');

    // 6. Student cannot request changes
    const res6 = await apiRequest('PATCH', `/api/events/${pendingEvent1._id}/request-changes`, { comments: 'Fix schedule' }, studentToken);
    assert(res6.status === 403, '6. Student cannot request changes (403)');

    // 7. President cannot request changes
    const res7 = await apiRequest('PATCH', `/api/events/${pendingEvent1._id}/request-changes`, { comments: 'Fix schedule' }, presToken);
    assert(res7.status === 403, '7. President cannot request changes (403)');

    // ------------------------------------------------------------------------
    // 2. APPROVAL WORKFLOW TESTS
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Approval Workflow ---');

    // 8. Admin can approve eligible event
    const res8 = await apiRequest(
      'PATCH',
      `/api/events/${pendingEvent1._id}/approve`,
      { comments: 'Approved by Dean of Student Affairs' },
      adminToken
    );
    assert(res8.status === 200 && res8.body.success === true, '8. Admin can approve eligible event (200)');
    assert(res8.body.event.status === EventStatus.APPROVED, '9. Event status changes to APPROVED in response');

    // 10. Check database Event doc
    const updatedEvent1 = await Event.findById(pendingEvent1._id);
    assert(updatedEvent1?.status === EventStatus.APPROVED, '10. Event document status is APPROVED in DB');

    // 11. Check Approval audit record created
    const approvalDoc1 = await Approval.findOne({ eventId: pendingEvent1._id, action: ApprovalAction.APPROVED });
    assert(approvalDoc1 !== null, '11. Approval record is created in MongoDB');
    assert(approvalDoc1?.reviewedBy.toString() === adminUser._id.toString(), '12. Approval record contains correct reviewedBy admin ID');
    assert(approvalDoc1?.action === ApprovalAction.APPROVED, '13. Approval action is APPROVED');
    assert(approvalDoc1?.comments === 'Approved by Dean of Student Affairs', '14. Approval comments stored correctly');

    // ------------------------------------------------------------------------
    // 3. REJECTION WORKFLOW TESTS
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Rejection Workflow ---');

    const pendingEvent2 = await createTestEvent('Pending Event 2 (Budget High)', EventStatus.PENDING_APPROVAL);

    // 15. Admin can reject eligible event
    const res15 = await apiRequest(
      'PATCH',
      `/api/events/${pendingEvent2._id}/reject`,
      { reason: 'Budget exceeds department limits for Q4' },
      adminToken
    );
    assert(res15.status === 200 && res15.body.success === true, '15. Admin can reject eligible event (200)');
    assert(res15.body.event.status === EventStatus.REJECTED, '16. Event status becomes REJECTED');

    // 17. Check database Event doc & rejectionReason field
    const updatedEvent2 = await Event.findById(pendingEvent2._id);
    assert(updatedEvent2?.status === EventStatus.REJECTED, '17. Event document status is REJECTED in DB');
    assert(updatedEvent2?.rejectionReason === 'Budget exceeds department limits for Q4', '18. Event rejectionReason field stored correctly');

    // 19. Check Approval audit record
    const approvalDoc2 = await Approval.findOne({ eventId: pendingEvent2._id, action: ApprovalAction.REJECTED });
    assert(approvalDoc2 !== null, '19. Approval record created for rejection');
    assert(approvalDoc2?.action === ApprovalAction.REJECTED, '20. Approval action is REJECTED');
    assert(approvalDoc2?.comments === 'Budget exceeds department limits for Q4', '21. Rejection comments stored in Approval');

    // ------------------------------------------------------------------------
    // 4. REQUEST CHANGES WORKFLOW TESTS
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Request Changes Workflow ---');

    const pendingEvent3 = await createTestEvent('Pending Event 3 (Incomplete Agenda)', EventStatus.PENDING_APPROVAL);

    // 22. Request changes rejects empty comments
    const res22Bad = await apiRequest(
      'PATCH',
      `/api/events/${pendingEvent3._id}/request-changes`,
      { comments: '   ' },
      adminToken
    );
    assert(res22Bad.status === 400, '22. Request changes rejects empty comments (400)');

    // 23. Admin can request changes with valid comments
    const res23 = await apiRequest(
      'PATCH',
      `/api/events/${pendingEvent3._id}/request-changes`,
      { comments: 'Please attach detailed speaker bios and time breakdown.' },
      adminToken
    );
    assert(res23.status === 200 && res23.body.success === true, '23. Admin can request changes when valid (200)');
    assert(res23.body.event.status === EventStatus.CHANGES_REQUESTED, '24. Event status becomes CHANGES_REQUESTED');

    // 25. Check database Event doc & changeComments field
    const updatedEvent3 = await Event.findById(pendingEvent3._id);
    assert(updatedEvent3?.status === EventStatus.CHANGES_REQUESTED, '25. Event doc status is CHANGES_REQUESTED in DB');
    assert(updatedEvent3?.changeComments === 'Please attach detailed speaker bios and time breakdown.', '26. Event changeComments stored correctly');

    // 27. Check Approval audit record
    const approvalDoc3 = await Approval.findOne({ eventId: pendingEvent3._id, action: ApprovalAction.CHANGES_REQUESTED });
    assert(approvalDoc3 !== null, '27. Approval record created for changes requested');
    assert(approvalDoc3?.action === ApprovalAction.CHANGES_REQUESTED, '28. Approval action is CHANGES_REQUESTED');

    // ------------------------------------------------------------------------
    // 5. APPROVAL HISTORY ENDPOINT (GET /api/events/:id/approvals)
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Approval History ---');

    // Add a second review step to pendingEvent3 to test history ordering (Admin subsequently approves after changes)
    await apiRequest(
      'PATCH',
      `/api/events/${pendingEvent3._id}/approve`,
      { comments: 'Updated bios verified. Approved.' },
      adminToken
    );

    // 29. Student can view approval history
    const res29Student = await apiRequest(
      'GET',
      `/api/events/${pendingEvent3._id}/approvals`,
      undefined,
      studentToken
    );
    assert(res29Student.status === 200, '29. Student can view approval history (200)');
    assert(Array.isArray(res29Student.body.approvals) && res29Student.body.count === 2, '30. Approval history returns 2 records');
    assert(res29Student.body.approvals[0].action === ApprovalAction.APPROVED, '31. Newest approval record is first');
    assert(res29Student.body.approvals[0].reviewedBy?.name === 'System Admin', '32. Reviewer info populated with name and email');
    assert(res29Student.body.approvals[0].reviewedBy?.password === undefined, '33. Password hash is never exposed in reviewer info');

    // 34. Missing event returns 404
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res34 = await apiRequest('GET', `/api/events/${fakeId}/approvals`, undefined, adminToken);
    assert(res34.status === 404, '34. Missing event GET approvals returns 404');

    // 35. Invalid event ID returns 400
    const res35 = await apiRequest('GET', '/api/events/invalid-event-id/approvals', undefined, adminToken);
    assert(res35.status === 400, '35. Invalid event ID format returns 400');

    // ------------------------------------------------------------------------
    // 6. DATA INTEGRITY & STATUS TRANSITION CHECKS
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Data Integrity & State Transitions ---');

    const fakeUserId = new mongoose.Types.ObjectId().toString();
    const freshEvent = await createTestEvent('Fresh Test Event', EventStatus.PENDING_APPROVAL);

    // 36. Client cannot spoof reviewedBy or action in request body
    const res36 = await apiRequest(
      'PATCH',
      `/api/events/${freshEvent._id}/approve`,
      {
        reviewedBy: fakeUserId,
        action: 'REJECTED',
        comments: 'Integrity test'
      },
      adminToken
    );
    assert(res36.status === 200, '36a. Approve request succeeds');
    const checkFreshApproval = await Approval.findOne({ eventId: freshEvent._id });
    assert(checkFreshApproval?.reviewedBy.toString() === adminUser._id.toString(), '36b. reviewedBy is strictly authenticated admin, not spoofed user');
    assert(checkFreshApproval?.action === ApprovalAction.APPROVED, '36c. action is strictly server-determined APPROVED, not spoofed body action');

    // 37. Cannot approve an already approved event
    const res37 = await apiRequest('PATCH', `/api/events/${freshEvent._id}/approve`, {}, adminToken);
    assert(res37.status === 400, '37. Cannot approve an already approved event (400)');

    // 38. Cannot approve a CANCELLED event
    const cancelledEvent = await createTestEvent('Cancelled Event', EventStatus.CANCELLED);
    const res38 = await apiRequest('PATCH', `/api/events/${cancelledEvent._id}/approve`, {}, adminToken);
    assert(res38.status === 400, '38. Cannot approve a CANCELLED event (400)');

    // 39. Cannot reject a CANCELLED event
    const res39 = await apiRequest('PATCH', `/api/events/${cancelledEvent._id}/reject`, { reason: 'No' }, adminToken);
    assert(res39.status === 400, '39. Cannot reject a CANCELLED event (400)');

    // 40. Cannot request changes on a COMPLETED event
    const completedEvent = await createTestEvent('Completed Event', EventStatus.COMPLETED);
    const res40 = await apiRequest('PATCH', `/api/events/${completedEvent._id}/request-changes`, { comments: 'Change date' }, adminToken);
    assert(res40.status === 400, '40. Cannot request changes on a COMPLETED event (400)');

    console.log(`\n========================================`);
    console.log(`Event Approval Tests: ${passedTests}/${totalTests} Passed.`);
    console.log(`========================================\n`);
  } finally {
    await stopTestEnvironment();
  }
}

runTests().catch((err) => {
  console.error('[Event Approval Tests FAILED]', err);
  process.exit(1);
});
