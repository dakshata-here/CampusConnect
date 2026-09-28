import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
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
  console.log('\n[ClubMembership Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[ClubMembership Tests] In-memory MongoDB connected: ${uri}`);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect_test';
    await mongoose.connect(fallbackUri);
  }

  await User.deleteMany({});
  await Club.deleteMany({});
  await ClubMembership.deleteMany({});

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`[ClubMembership Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[ClubMembership Tests] Cleaning up test environment...');
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
  console.log(`[ClubMembership Tests] Completed: ${passedTests}/${totalTests} tests passed.\n`);
}

async function runTests() {
  try {
    await startTestEnvironment();

    // 1. Seed Users
    const adminUser = await User.create({
      name: 'College Dean Admin',
      email: 'dean.admin@college.edu',
      password: 'Password@123',
      role: UserRole.COLLEGE_ADMIN,
      status: 'active'
    });

    const leadUserA = await User.create({
      name: 'Aditya Lead IEEE',
      email: 'aditya.ieee@college.edu',
      password: 'Password@123',
      role: UserRole.CLUB_PRESIDENT,
      status: 'active'
    });

    const leadUserB = await User.create({
      name: 'Siddharth Lead Robotics',
      email: 'siddharth.robo@college.edu',
      password: 'Password@123',
      role: UserRole.CLUB_PRESIDENT,
      status: 'active'
    });

    const studentUser1 = await User.create({
      name: 'Rahul Student',
      email: 'rahul.student@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT,
      status: 'active'
    });

    const studentUser2 = await User.create({
      name: 'Ananya Student',
      email: 'ananya.student@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT,
      status: 'active'
    });

    const studentUser3 = await User.create({
      name: 'Vikram Candidate Lead',
      email: 'vikram.lead@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT,
      status: 'active'
    });

    // Generate tokens
    const adminToken = generateToken({
      id: (adminUser._id as any).toString(),
      email: adminUser.email,
      role: adminUser.role
    });

    const leadAToken = generateToken({
      id: (leadUserA._id as any).toString(),
      email: leadUserA.email,
      role: leadUserA.role
    });

    const leadBToken = generateToken({
      id: (leadUserB._id as any).toString(),
      email: leadUserB.email,
      role: leadUserB.role
    });

    const student1Token = generateToken({
      id: (studentUser1._id as any).toString(),
      email: studentUser1.email,
      role: studentUser1.role
    });

    // 2. Seed Clubs
    const clubA = await Club.create({
      name: 'IEEE Student Branch',
      shortName: 'IEEE',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    const clubB = await Club.create({
      name: 'Robotics Club',
      shortName: 'ROBO',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    const emptyClub = await Club.create({
      name: 'Empty Hobby Club',
      shortName: 'HOBBY',
      category: ClubCategory.OTHER,
      status: ClubStatus.ACTIVE
    });

    const clubAId = (clubA._id as any).toString();
    const clubBId = (clubB._id as any).toString();
    const emptyClubId = (emptyClub._id as any).toString();

    // 3. Seed Initial Memberships
    // Club A Lead
    await ClubMembership.create({
      clubId: clubA._id,
      userId: leadUserA._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Chairperson',
      isActive: true
    });

    // Club A Member
    await ClubMembership.create({
      clubId: clubA._id,
      userId: studentUser1._id,
      role: ClubMembershipRole.MEMBER,
      designation: 'Technical Core',
      isActive: true
    });

    // Club B Lead
    await ClubMembership.create({
      clubId: clubB._id,
      userId: leadUserB._id,
      role: ClubMembershipRole.LEAD,
      designation: 'President',
      isActive: true
    });

    console.log('\n=========================================');
    console.log(' SECTION A: GET MEMBERS (/api/clubs/:clubId/members)');
    console.log('=========================================');

    // 1. Authenticated student receives 200
    const studentGetMembersRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    const studentGetMembersData = (await studentGetMembersRes.json()) as any;
    assert(studentGetMembersRes.status === 200, 'Student can view club members (200 OK)');
    assert(studentGetMembersData.count === 2, 'Returns accurate member count (2)');
    assert(Array.isArray(studentGetMembersData.members), 'Returns members array');
    assert(studentGetMembersData.members[0].user.password === undefined, 'Does not expose user password');

    // 2. Authenticated president receives 200
    const presGetMembersRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      headers: { Authorization: `Bearer ${leadBToken}` }
    });
    assert(presGetMembersRes.status === 200, 'President can view club members (200 OK)');

    // 3. Authenticated admin receives 200
    const adminGetMembersRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminGetMembersRes.status === 200, 'Admin can view club members (200 OK)');

    // 4. Unauthenticated returns 401
    const unauthGetMembersRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`);
    assert(unauthGetMembersRes.status === 401, 'Unauthenticated member query returns 401 Unauthorized');

    // 5. Nonexistent club returns 404
    const nonExistentClubId = new mongoose.Types.ObjectId().toString();
    const notFoundMembersRes = await fetch(`${baseUrl}/api/clubs/${nonExistentClubId}/members`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(notFoundMembersRes.status === 404, 'Non-existent club returns 404 Not Found');

    // 6. Invalid clubId returns 400
    const badClubIdMembersRes = await fetch(`${baseUrl}/api/clubs/invalid-id/members`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(badClubIdMembersRes.status === 400, 'Invalid club ID format returns 400 Bad Request');

    console.log('\n=========================================');
    console.log(' SECTION B: GET ACTIVE LEAD (/api/clubs/:clubId/lead)');
    console.log('=========================================');

    // 7. Active lead exists returns 200
    const getLeadRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/lead`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    const getLeadData = (await getLeadRes.json()) as any;
    assert(getLeadRes.status === 200, 'GET /api/clubs/:clubId/lead returns 200 OK');
    assert(getLeadData.lead.role === 'LEAD', 'Lead membership role is LEAD');
    assert(getLeadData.lead.user.name === 'Aditya Lead IEEE', 'Returns correct lead user name');
    assert(getLeadData.lead.user.password === undefined, 'Password omitted in lead data');

    // 8. No active lead in empty club returns 404
    const noLeadRes = await fetch(`${baseUrl}/api/clubs/${emptyClubId}/lead`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(noLeadRes.status === 404, 'Returns 404 Not Found when club has no active lead');

    // 9. Unauthenticated returns 401
    const unauthLeadRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/lead`);
    assert(unauthLeadRes.status === 401, 'Unauthenticated lead query returns 401 Unauthorized');

    // 10. Invalid clubId returns 400
    const badClubIdLeadRes = await fetch(`${baseUrl}/api/clubs/bad-id/lead`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(badClubIdLeadRes.status === 400, 'Invalid club ID format returns 400 Bad Request');

    console.log('\n=========================================');
    console.log(' SECTION C: ADD MEMBER (/api/clubs/:clubId/members)');
    console.log('=========================================');

    const student2Id = (studentUser2._id as any).toString();

    // 11. College admin adds member returns 201
    const adminAddRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: student2Id,
        designation: 'Logistics Head'
      })
    });
    const adminAddData = (await adminAddRes.json()) as any;
    assert(adminAddRes.status === 201, 'College Admin adds club member (201 Created)', adminAddData);
    assert(adminAddData.membership.role === 'MEMBER', 'Default membership role is MEMBER');
    assert(adminAddData.membership.designation === 'Logistics Head', 'Designation assigned correctly');

    // 12. Active club LEAD adds member returns 201
    const student3Id = (studentUser3._id as any).toString();
    const leadAddRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadAToken}` // Lead of Club A
      },
      body: JSON.stringify({
        userId: student3Id,
        designation: 'Event Coordinator'
      })
    });
    const leadAddData = (await leadAddRes.json()) as any;
    assert(leadAddRes.status === 201, 'Active club LEAD adds member to their club (201 Created)', leadAddData);

    // 13. Unrelated president attempts to add member to Club A returns 403
    const foreignUser = await User.create({
      name: 'Foreign Student',
      email: 'foreign@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT
    });
    const foreignUserId = (foreignUser._id as any).toString();

    const unrelatedPresAddRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadBToken}` // Lead of Club B trying to add to Club A
      },
      body: JSON.stringify({
        userId: foreignUserId,
        designation: 'Spy'
      })
    });
    assert(unrelatedPresAddRes.status === 403, 'Unrelated president DENIED adding member to another club with 403 Forbidden');

    // 14. Student attempts to add member returns 403
    const studentAddRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`
      },
      body: JSON.stringify({
        userId: foreignUserId
      })
    });
    assert(studentAddRes.status === 403, 'Student DENIED adding member with 403 Forbidden');

    // 15. Unauthenticated returns 401
    const unauthAddRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: foreignUserId })
    });
    assert(unauthAddRes.status === 401, 'Unauthenticated add member returns 401 Unauthorized');

    // 16. Duplicate membership returns 409 Conflict
    const dupAddRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: student2Id // Already added to Club A
      })
    });
    assert(dupAddRes.status === 409, 'Duplicate membership rejected with 409 Conflict');

    // 17. Nonexistent user returns 404
    const nonExistentUserId = new mongoose.Types.ObjectId().toString();
    const notFoundUserRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: nonExistentUserId
      })
    });
    assert(notFoundUserRes.status === 404, 'Non-existent user returns 404 Not Found');

    // 18. Nonexistent club returns 404
    const notFoundClubRes = await fetch(`${baseUrl}/api/clubs/${nonExistentClubId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: foreignUserId
      })
    });
    assert(notFoundClubRes.status === 404, 'Non-existent club returns 404 Not Found');

    // 19. Invalid userId returns 400
    const badUserIdRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: 'invalid-user-id'
      })
    });
    assert(badUserIdRes.status === 400, 'Invalid user ID format returns 400 Bad Request');

    // 20. Invalid clubId returns 400
    const badClubIdAddRes = await fetch(`${baseUrl}/api/clubs/invalid-club-id/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: foreignUserId
      })
    });
    assert(badClubIdAddRes.status === 400, 'Invalid club ID format returns 400 Bad Request');

    console.log('\n=========================================');
    console.log(' SECTION D: UPDATE MEMBERSHIP (PATCH /api/clubs/:clubId/members/:userId)');
    console.log('=========================================');

    // 21. Admin updates membership returns 200
    const adminUpdateRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        designation: 'Senior Logistics Head'
      })
    });
    const adminUpdateData = (await adminUpdateRes.json()) as any;
    assert(adminUpdateRes.status === 200, 'Admin updates membership with 200 OK');
    assert(adminUpdateData.membership.designation === 'Senior Logistics Head', 'Designation updated');

    // 22. Active club LEAD updates membership in their club returns 200
    const leadUpdateRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadAToken}`
      },
      body: JSON.stringify({
        designation: 'Operations Lead'
      })
    });
    const leadUpdateData = (await leadUpdateRes.json()) as any;
    assert(leadUpdateRes.status === 200, 'Active club LEAD updates member designation with 200 OK');
    assert(leadUpdateData.membership.designation === 'Operations Lead', 'Designation updated by lead');

    // 23. Unrelated president updating Club A returns 403
    const unrelatedPresUpdateRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadBToken}`
      },
      body: JSON.stringify({ designation: 'Hacked' })
    });
    assert(unrelatedPresUpdateRes.status === 403, 'Unrelated president DENIED updating membership in another club (403 Forbidden)');

    // 24. Student update returns 403
    const studentUpdateRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`
      },
      body: JSON.stringify({ designation: 'Hacked' })
    });
    assert(studentUpdateRes.status === 403, 'Student DENIED updating membership (403 Forbidden)');

    // 25. Nonexistent membership returns 404
    const notFoundMembershipRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${foreignUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ designation: 'Test' })
    });
    assert(notFoundMembershipRes.status === 404, 'Non-existent membership returns 404 Not Found');

    // 26. Invalid role value returns 400
    const badRoleUpdateRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: 'INVALID_ROLE' })
    });
    assert(badRoleUpdateRes.status === 400, 'Rejects invalid membership role with 400 Bad Request');

    console.log('\n=========================================');
    console.log(' SECTION E: REMOVE / DEACTIVATE MEMBER (DELETE /api/clubs/:clubId/members/:userId)');
    console.log('=========================================');

    // 27. Admin deactivates member returns 200
    const adminDeactRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminDeactData = (await adminDeactRes.json()) as any;
    assert(adminDeactRes.status === 200, 'Admin deactivates member (200 OK)');
    assert(adminDeactData.membership.isActive === false, 'Membership isActive is set to false');

    // Reactivate student2 for further testing
    await ClubMembership.updateOne(
      { clubId: clubA._id, userId: studentUser2._id },
      { $set: { isActive: true } }
    );

    // 28. Active club LEAD deactivates member in their club returns 200
    const leadDeactRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${leadAToken}` }
    });
    const leadDeactData = (await leadDeactRes.json()) as any;
    assert(leadDeactRes.status === 200, 'Active club LEAD deactivates member in their club (200 OK)');
    assert(leadDeactData.membership.isActive === false, 'Membership isActive set to false by lead');

    // 29. Unrelated president deactivating returns 403
    const unrelatedPresDeactRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student3Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${leadBToken}` }
    });
    assert(unrelatedPresDeactRes.status === 403, 'Unrelated president DENIED deactivating member in another club (403 Forbidden)');

    // 30. Student deactivating returns 403
    const studentDeactRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student3Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(studentDeactRes.status === 403, 'Student DENIED deactivating member (403 Forbidden)');

    // 31. Nonexistent membership returns 404
    const notFoundDeactRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${foreignUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(notFoundDeactRes.status === 404, 'Non-existent membership returns 404 on deactivation');

    console.log('\n=========================================');
    console.log(' SECTION F: LEAD MANAGEMENT (Promotion, Demotion & Single Active Lead Invariant)');
    console.log('=========================================');

    // 32. Assign existing member as LEAD
    const promoteRes = await fetch(`${baseUrl}/api/clubs/${clubAId}/members/${student3Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        role: 'LEAD',
        designation: 'New Chapter Lead'
      })
    });
    const promoteData = (await promoteRes.json()) as any;
    assert(promoteRes.status === 200, 'Promote existing member to LEAD returns 200 OK');
    assert(promoteData.membership.role === 'LEAD', 'Member role promoted to LEAD');

    // 33. Assign new user directly as LEAD
    const newLeadCandidate = await User.create({
      name: 'Pooja New Lead',
      email: 'pooja.newlead@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT
    });
    const newLeadCandidateId = (newLeadCandidate._id as any).toString();

    const addNewLeadRes = await fetch(`${baseUrl}/api/clubs/${emptyClubId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: newLeadCandidateId,
        role: 'LEAD',
        designation: 'Founding President'
      })
    });
    const addNewLeadData = (await addNewLeadRes.json()) as any;
    assert(addNewLeadRes.status === 201, 'Assign new member directly as LEAD (201 Created)');
    assert(addNewLeadData.membership.role === 'LEAD', 'Direct lead assignment role is LEAD');

    // 34. Verify previous active lead handling (previous lead demoted to MEMBER)
    const previousLeadMembership = await ClubMembership.findOne({
      clubId: clubA._id,
      userId: leadUserA._id
    });
    assert(
      previousLeadMembership?.role === ClubMembershipRole.MEMBER,
      'Previous active lead automatically demoted to MEMBER in controlled handover'
    );

    // 35. Verify only intended club is affected (Club B lead remains unaffected)
    const clubBLeadMembership = await ClubMembership.findOne({
      clubId: clubB._id,
      userId: leadUserB._id
    });
    assert(
      clubBLeadMembership?.role === ClubMembershipRole.LEAD && clubBLeadMembership?.isActive === true,
      'Club B active lead remains completely unaffected'
    );

    // 36. Verify User.role in User.ts remains unchanged (auth role intact)
    const freshUserA = await User.findById(leadUserA._id);
    const freshStudent3 = await User.findById(studentUser3._id);
    assert(freshUserA?.role === UserRole.CLUB_PRESIDENT, 'Original president user role in User.ts remains president');
    assert(freshStudent3?.role === UserRole.STUDENT, 'Promoted lead user role in User.ts remains student');

    // 37. Verify membership role in ClubMembership is LEAD
    const currentClubALead = await ClubMembership.findOne({
      clubId: clubA._id,
      userId: studentUser3._id
    });
    assert(currentClubALead?.role === ClubMembershipRole.LEAD, 'ClubMembership role is LEAD');

    // 38. Verify unrelated club cannot be modified by former lead of Club A
    const formerLeadAttemptRes = await fetch(`${baseUrl}/api/clubs/${clubBId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${leadAToken}` // Former lead of Club A attempting to add to Club B
      },
      body: JSON.stringify({
        userId: foreignUserId,
        designation: 'Unrelated'
      })
    });
    assert(formerLeadAttemptRes.status === 403, 'Former lead cannot modify unrelated club (403 Forbidden)');

    console.log('\n=========================================');
    console.log(` ALL ${totalTests} CLUB MEMBERSHIP TESTS PASSED!`);
    console.log('=========================================\n');
  } finally {
    await stopTestEnvironment();
  }
}

runTests().catch((err) => {
  console.error('[ClubMembership Test Error]', err);
  process.exit(1);
});
