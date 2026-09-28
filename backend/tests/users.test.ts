import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
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
  console.log('\n[Test Suite] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Test Suite] In-memory MongoDB connected: ${uri}`);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect_test';
    await mongoose.connect(fallbackUri);
  }

  await User.deleteMany({});

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`[Test Suite] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Test Suite] Cleaning up test environment...');
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

async function runTests() {
  try {
    await startTestEnvironment();

    // Seed test users
    const student = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan.student@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT,
      enrollmentNumber: 'C2K2310055',
      department: 'Computer Engineering',
      year: 'TE (3rd Year)',
      phone: '9876543210',
      bio: 'Open source enthusiast',
      status: 'active'
    });

    const student2 = await User.create({
      name: 'Pooja Verma',
      email: 'pooja.student@college.edu',
      password: 'Password@123',
      role: UserRole.STUDENT,
      enrollmentNumber: 'C2K2310099',
      department: 'Information Technology',
      year: 'SE (2nd Year)',
      status: 'active'
    });

    const admin = await User.create({
      name: 'Campus Administrator',
      email: 'admin.users@college.edu',
      password: 'Password@123',
      role: UserRole.COLLEGE_ADMIN,
      department: 'Administration',
      status: 'active'
    });

    const studentToken = generateToken({
      id: (student._id as any).toString(),
      email: student.email,
      role: student.role
    });

    const adminToken = generateToken({
      id: (admin._id as any).toString(),
      email: admin.email,
      role: admin.role
    });

    console.log('\n=========================================');
    console.log(' SECTION 1: GET /api/users/profile');
    console.log('=========================================');

    // 1.1 Unauthenticated request returns 401
    const unauthProfileRes = await fetch(`${baseUrl}/api/users/profile`);
    assert(unauthProfileRes.status === 401, 'GET /api/users/profile without token returns 401 Unauthorized');

    // 1.2 Authenticated request returns 200 with sanitized profile
    const studentProfileRes = await fetch(`${baseUrl}/api/users/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentProfileData = (await studentProfileRes.json()) as any;
    assert(studentProfileRes.status === 200, 'GET /api/users/profile returns 200 OK with valid token');
    assert(studentProfileData.success === true, 'Response indicates success: true');
    assert(studentProfileData.user.email === 'rohan.student@college.edu', 'Returns correct profile email');
    assert(studentProfileData.user.name === 'Rohan Sharma', 'Returns correct profile name');
    assert(studentProfileData.user.password === undefined, 'Password is NOT exposed in profile response');

    console.log('\n=========================================');
    console.log(' SECTION 2: PUT /api/users/profile');
    console.log('=========================================');

    // 2.1 Unauthenticated update returns 401
    const unauthUpdateRes = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: 'New bio' })
    });
    assert(unauthUpdateRes.status === 401, 'PUT /api/users/profile without token returns 401 Unauthorized');

    // 2.2 Allowed profile update succeeds
    const updateRes = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        bio: 'Updated bio for Rohan',
        phone: '9998887776',
        year: 'BE (Final Year)',
        followedClubs: ['CLUB001', 'CLUB002']
      })
    });
    const updateData = (await updateRes.json()) as any;
    assert(updateRes.status === 200, 'PUT /api/users/profile returns 200 OK for valid updates');
    assert(updateData.user.bio === 'Updated bio for Rohan', 'Bio successfully updated');
    assert(updateData.user.phone === '9998887776', 'Phone successfully updated');
    assert(updateData.user.year === 'BE (Final Year)', 'Year successfully updated');
    assert(updateData.user.followedClubs.length === 2, 'Followed clubs list updated');
    assert(updateData.user.password === undefined, 'Password is NOT returned on profile update');

    // 2.3 Prohibited field changes (role, status) are ignored/protected
    const maliciousUpdateRes = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        role: 'college_admin',
        status: 'pending',
        password: 'HackedPassword123'
      })
    });
    const maliciousData = (await maliciousUpdateRes.json()) as any;
    assert(maliciousUpdateRes.status === 200, 'PUT /api/users/profile succeeds but ignores forbidden fields');
    assert(maliciousData.user.role === 'student', 'User role CANNOT be escalated via profile update');
    assert(maliciousData.user.status === 'active', 'User status CANNOT be manipulated via profile update');

    // 2.4 Duplicate enrollment number returns 409 Conflict
    const dupEnrollmentRes = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        enrollmentNumber: 'C2K2310099' // belongs to student2
      })
    });
    assert(dupEnrollmentRes.status === 409, 'Rejects duplicate enrollment number with 409 Conflict');

    console.log('\n=========================================');
    console.log(' SECTION 3: GET /api/users (Admin Only)');
    console.log('=========================================');

    // 3.1 Unauthenticated request returns 401
    const unauthUsersRes = await fetch(`${baseUrl}/api/users`);
    assert(unauthUsersRes.status === 401, 'GET /api/users without token returns 401 Unauthorized');

    // 3.2 Student requesting users list returns 403 Forbidden
    const studentUsersRes = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentUsersRes.status === 403, 'Student DENIED access to GET /api/users with 403 Forbidden');

    // 3.3 Admin requesting users list returns 200 with all users
    const adminUsersRes = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminUsersData = (await adminUsersRes.json()) as any;
    assert(adminUsersRes.status === 200, 'College Admin can access GET /api/users with 200 OK');
    assert(adminUsersData.success === true, 'Response contains success: true');
    assert(Array.isArray(adminUsersData.users), 'Response contains array of users');
    assert(adminUsersData.users.length >= 3, 'Returns all registered users');
    assert(
      adminUsersData.users.every((u: any) => u.password === undefined),
      'No user object exposes password field'
    );

    console.log('\n=========================================');
    console.log(` ALL ${totalTests} STEP 1 USER API TESTS PASSED!`);
    console.log('=========================================\n');
  } finally {
    await stopTestEnvironment();
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
