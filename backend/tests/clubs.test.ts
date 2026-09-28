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
  console.log('\n[Club Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Club Tests] In-memory MongoDB connected: ${uri}`);
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
      console.log(`[Club Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Club Tests] Cleaning up test environment...');
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
  console.log(`[Club Tests] Completed: ${passedTests}/${totalTests} tests passed.\n`);
}

async function runTests() {
  try {
    await startTestEnvironment();

    // 1. Seed test users
    const studentUser = await User.create({
      name: 'Aarav Student',
      email: 'aarav.student@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT,
      status: 'active'
    });

    const presidentUser = await User.create({
      name: 'Neha President',
      email: 'neha.pres@college.edu',
      password: 'Password@123',
      role: UserRole.CLUB_PRESIDENT,
      status: 'active'
    });

    const adminUser = await User.create({
      name: 'Dean College Admin',
      email: 'admin.clubs@college.edu',
      password: 'Password@123',
      role: UserRole.COLLEGE_ADMIN,
      status: 'active'
    });

    const studentToken = generateToken({
      id: (studentUser._id as any).toString(),
      email: studentUser.email,
      role: studentUser.role
    });

    const presidentToken = generateToken({
      id: (presidentUser._id as any).toString(),
      email: presidentUser.email,
      role: presidentUser.role
    });

    const adminToken = generateToken({
      id: (adminUser._id as any).toString(),
      email: adminUser.email,
      role: adminUser.role
    });

    // 2. Seed initial club & membership
    const initialClub = await Club.create({
      name: 'IEEE Student Branch',
      shortName: 'IEEE',
      description: 'Advancing technology for humanity',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE,
      socialLinks: {
        website: 'https://ieee.college.edu',
        instagram: 'https://instagram.com/ieee_college'
      }
    });

    await ClubMembership.create({
      clubId: initialClub._id,
      userId: presidentUser._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Chairperson',
      isActive: true
    });

    console.log('\n=========================================');
    console.log(' SECTION 1: GET /api/clubs (Listing)');
    console.log('=========================================');

    // 1.1 Unauthenticated request returns 401
    const unauthClubsRes = await fetch(`${baseUrl}/api/clubs`);
    assert(unauthClubsRes.status === 401, 'GET /api/clubs without token returns 401 Unauthorized');

    // 1.2 Authenticated student receives 200
    const studentClubsRes = await fetch(`${baseUrl}/api/clubs`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentClubsData = (await studentClubsRes.json()) as any;
    assert(studentClubsRes.status === 200, 'GET /api/clubs with student token returns 200 OK');
    assert(studentClubsData.success === true, 'Response success: true');
    assert(Array.isArray(studentClubsData.clubs), 'Response contains clubs array');
    assert(studentClubsData.clubs.length >= 1, 'Clubs array contains at least 1 club');

    // 1.3 Authenticated president receives 200
    const presClubsRes = await fetch(`${baseUrl}/api/clubs`, {
      headers: { Authorization: `Bearer ${presidentToken}` }
    });
    assert(presClubsRes.status === 200, 'GET /api/clubs with president token returns 200 OK');

    // 1.4 Authenticated admin receives 200
    const adminClubsRes = await fetch(`${baseUrl}/api/clubs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminClubsRes.status === 200, 'GET /api/clubs with admin token returns 200 OK');

    console.log('\n=========================================');
    console.log(' SECTION 2: GET /api/clubs/:id (Details)');
    console.log('=========================================');

    const clubId = (initialClub._id as any).toString();

    // 2.1 Unauthenticated request returns 401
    const unauthDetailRes = await fetch(`${baseUrl}/api/clubs/${clubId}`);
    assert(unauthDetailRes.status === 401, 'GET /api/clubs/:id without token returns 401 Unauthorized');

    // 2.2 Valid club details with active lead returns 200
    const detailRes = await fetch(`${baseUrl}/api/clubs/${clubId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const detailData = (await detailRes.json()) as any;
    assert(detailRes.status === 200, 'GET /api/clubs/:id returns 200 OK for valid club ID');
    assert(detailData.success === true, 'Response indicates success');
    assert(detailData.club.name === 'IEEE Student Branch', 'Returns correct club name');
    assert(detailData.club.category === 'TECHNICAL', 'Returns correct category');
    assert(detailData.club.lead !== null, 'Returns populated active lead');
    assert(detailData.club.lead.designation === 'Chairperson', 'Returns lead designation');

    // 2.3 Non-existent valid ObjectId returns 404
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await fetch(`${baseUrl}/api/clubs/${nonExistentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(notFoundRes.status === 404, 'GET /api/clubs/:id returns 404 for non-existent club');

    // 2.4 Malformed / Invalid ObjectId returns 400
    const badIdRes = await fetch(`${baseUrl}/api/clubs/not-a-valid-object-id`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(badIdRes.status === 400, 'GET /api/clubs/:id returns 400 for invalid ObjectId format');

    console.log('\n=========================================');
    console.log(' SECTION 3: POST /api/clubs (Creation)');
    console.log('=========================================');

    // 3.1 Unauthenticated creation returns 401
    const unauthCreateRes = await fetch(`${baseUrl}/api/clubs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Robotics Club', shortName: 'ROBO' })
    });
    assert(unauthCreateRes.status === 401, 'POST /api/clubs without token returns 401 Unauthorized');

    // 3.2 Student attempting creation returns 403 Forbidden
    const studentCreateRes = await fetch(`${baseUrl}/api/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ name: 'Robotics Club', shortName: 'ROBO' })
    });
    assert(studentCreateRes.status === 403, 'Student DENIED creation with 403 Forbidden');

    // 3.3 President attempting creation returns 403 Forbidden
    const presCreateRes = await fetch(`${baseUrl}/api/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${presidentToken}`
      },
      body: JSON.stringify({ name: 'Robotics Club', shortName: 'ROBO' })
    });
    assert(presCreateRes.status === 403, 'President DENIED creation with 403 Forbidden');

    // 3.4 Missing required field (name) returns 400 Bad Request
    const noNameRes = await fetch(`${baseUrl}/api/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ shortName: 'ROBO' })
    });
    assert(noNameRes.status === 400, 'Rejects missing club name with 400 Bad Request');

    // 3.5 Missing required field (shortName) returns 400 Bad Request
    const noShortNameRes = await fetch(`${baseUrl}/api/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'Robotics Club' })
    });
    assert(noShortNameRes.status === 400, 'Rejects missing shortName with 400 Bad Request');

    // 3.6 Invalid category enum returns 400 Bad Request
    const badCatRes = await fetch(`${baseUrl}/api/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Robotics Club',
        shortName: 'ROBO',
        category: 'INVALID_CATEGORY'
      })
    });
    assert(badCatRes.status === 400, 'Rejects invalid category enum with 400 Bad Request');

    // 3.7 Admin creates valid club returns 201 Created
    const createRes = await fetch(`${baseUrl}/api/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Robotics Club',
        shortName: 'ROBO',
        description: 'Building autonomous robots and drones',
        category: 'TECHNICAL',
        status: 'ACTIVE',
        socialLinks: {
          website: 'https://robotics.college.edu',
          instagram: 'https://instagram.com/robo_college'
        }
      })
    });
    const createData = (await createRes.json()) as any;
    assert(createRes.status === 201, 'College Admin creates club with 201 Created', createData);
    assert(createData.club.name === 'Robotics Club', 'Created club name matches');
    assert(createData.club.category === 'TECHNICAL', 'Created club category matches');
    assert(createData.club.status === 'ACTIVE', 'Created club status is ACTIVE');

    const createdClubId = createData.club.id;

    // 3.8 Duplicate name rejection returns 409 Conflict
    const dupNameRes = await fetch(`${baseUrl}/api/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Robotics Club', // duplicate name
        shortName: 'NEWROBO'
      })
    });
    assert(dupNameRes.status === 409, 'Rejects duplicate club name with 409 Conflict');

    // 3.9 Duplicate shortName rejection returns 409 Conflict
    const dupShortNameRes = await fetch(`${baseUrl}/api/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Unique Robotics Club',
        shortName: 'ROBO' // duplicate shortName
      })
    });
    assert(dupShortNameRes.status === 409, 'Rejects duplicate club shortName with 409 Conflict');

    console.log('\n=========================================');
    console.log(' SECTION 4: PUT /api/clubs/:id (Update)');
    console.log('=========================================');

    // 4.1 Student update returns 403
    const studentUpdateRes = await fetch(`${baseUrl}/api/clubs/${createdClubId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ description: 'Updated description' })
    });
    assert(studentUpdateRes.status === 403, 'Student DENIED club update with 403 Forbidden');

    // 4.2 President update returns 403
    const presUpdateRes = await fetch(`${baseUrl}/api/clubs/${createdClubId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${presidentToken}`
      },
      body: JSON.stringify({ description: 'Updated description' })
    });
    assert(presUpdateRes.status === 403, 'President DENIED club update with 403 Forbidden');

    // 4.3 Invalid ID returns 400
    const badIdUpdateRes = await fetch(`${baseUrl}/api/clubs/bad-id`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ description: 'Updated description' })
    });
    assert(badIdUpdateRes.status === 400, 'PUT /api/clubs/:id returns 400 for invalid ID');

    // 4.4 Non-existent ID returns 404
    const notFoundUpdateRes = await fetch(`${baseUrl}/api/clubs/${nonExistentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ description: 'Updated description' })
    });
    assert(notFoundUpdateRes.status === 404, 'PUT /api/clubs/:id returns 404 for non-existent club');

    // 4.5 Invalid category in update returns 400
    const badCatUpdateRes = await fetch(`${baseUrl}/api/clubs/${createdClubId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ category: 'NON_EXISTENT_CAT' })
    });
    assert(badCatUpdateRes.status === 400, 'PUT /api/clubs/:id rejects invalid category with 400 Bad Request');

    // 4.6 Admin valid update returns 200 OK
    const validUpdateRes = await fetch(`${baseUrl}/api/clubs/${createdClubId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        description: 'Advanced Robotics and AI Hardware Club',
        socialLinks: {
          website: 'https://robotics-updated.college.edu',
          youtube: 'https://youtube.com/@robotics-college'
        }
      })
    });
    const validUpdateData = (await validUpdateRes.json()) as any;
    assert(validUpdateRes.status === 200, 'College Admin updates club with 200 OK');
    assert(
      validUpdateData.club.description === 'Advanced Robotics and AI Hardware Club',
      'Club description updated'
    );
    assert(
      validUpdateData.club.socialLinks.youtube === 'https://youtube.com/@robotics-college',
      'Club socialLinks updated'
    );

    console.log('\n=========================================');
    console.log(' SECTION 5: PATCH /api/clubs/:id/status (Status)');
    console.log('=========================================');

    // 5.1 Student status update returns 403
    const studentStatusRes = await fetch(`${baseUrl}/api/clubs/${createdClubId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ status: 'INACTIVE' })
    });
    assert(studentStatusRes.status === 403, 'Student DENIED status update with 403 Forbidden');

    // 5.2 President status update returns 403
    const presStatusRes = await fetch(`${baseUrl}/api/clubs/${createdClubId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${presidentToken}`
      },
      body: JSON.stringify({ status: 'INACTIVE' })
    });
    assert(presStatusRes.status === 403, 'President DENIED status update with 403 Forbidden');

    // 5.3 Invalid status value returns 400
    const badStatusRes = await fetch(`${baseUrl}/api/clubs/${createdClubId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'PENDING_APPROVAL' })
    });
    assert(badStatusRes.status === 400, 'PATCH /api/clubs/:id/status rejects invalid status with 400 Bad Request');

    // 5.4 Non-existent ID returns 404
    const notFoundStatusRes = await fetch(`${baseUrl}/api/clubs/${nonExistentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'INACTIVE' })
    });
    assert(notFoundStatusRes.status === 404, 'PATCH /api/clubs/:id/status returns 404 for non-existent club');

    // 5.5 Admin sets status to INACTIVE returns 200
    const inactiveRes = await fetch(`${baseUrl}/api/clubs/${createdClubId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'INACTIVE' })
    });
    const inactiveData = (await inactiveRes.json()) as any;
    assert(inactiveRes.status === 200, 'Admin sets status to INACTIVE with 200 OK');
    assert(inactiveData.club.status === 'INACTIVE', 'Club status updated to INACTIVE');

    // 5.6 Admin sets status back to ACTIVE returns 200
    const activeRes = await fetch(`${baseUrl}/api/clubs/${createdClubId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    const activeData = (await activeRes.json()) as any;
    assert(activeRes.status === 200, 'Admin sets status back to ACTIVE with 200 OK');
    assert(activeData.club.status === 'ACTIVE', 'Club status updated to ACTIVE');

    console.log('\n=========================================');
    console.log(` ALL ${totalTests} CLUB API TESTS PASSED!`);
    console.log('=========================================\n');
  } finally {
    await stopTestEnvironment();
  }
}

runTests().catch((err) => {
  console.error('[Club Test Error]', err);
  process.exit(1);
});
