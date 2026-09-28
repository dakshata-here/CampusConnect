import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';

let mongod: MongoMemoryServer | null = null;
let server: http.Server;
let baseUrl = '';

const JWT_TEST_SECRET = 'super_secret_test_jwt_key_1234567890';
process.env.JWT_SECRET = JWT_TEST_SECRET;
process.env.JWT_EXPIRES_IN = '1h';

// Helper for assertions
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
    console.warn('[Test Suite] MongoMemoryServer unavailable, connecting to local MongoDB...');
    const fallbackUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect_test';
    await mongoose.connect(fallbackUri);
  }

  // Clear test users
  await User.deleteMany({});

  // Start app on ephemeral port
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
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
  console.log(`[Test Suite] Completed: ${passedTests}/${totalTests} tests passed.`);
}

async function runTests() {
  await startTestEnvironment();

  try {
    console.log('\n=========================================');
    console.log(' SECTION 1: USER REGISTRATION');
    console.log('=========================================');

    // 1. Register a student
    const studentRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Patel',
        email: 'aarav.student@pict.edu',
        password: 'Password@123',
        role: 'student',
        enrollmentNumber: 'C2K2310001',
        department: 'Computer Engineering',
        year: 'TE (3rd Year)',
        phone: '9876543210'
      })
    });
    const studentData = await studentRes.json();
    assert(studentRes.status === 201, 'Student registered with status 201', studentData);
    assert(!!studentData.token, 'Student registration returns JWT token');
    assert(studentData.user.role === 'student', 'Student role is "student"');
    assert(!studentData.user.password, 'Password is not exposed in registration response');

    // 2. Register a Club President
    const presRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Neha Deshmukh',
        email: 'neha.pres@pict.edu',
        password: 'President@123',
        role: 'president',
        enrollmentNumber: 'C2K2210099',
        clubId: 'CLUB_ROBOTICS',
        clubName: 'Robotics Club',
        department: 'Electronics',
        year: 'BE (4th Year)'
      })
    });
    const presData = await presRes.json();
    assert(presRes.status === 201, 'Club President registered with status 201', presData);
    assert(presData.user.role === 'president', 'President role is "president"');
    assert(presData.user.clubId === 'CLUB_ROBOTICS', 'President clubId assigned');

    // 3. Register a College Admin
    const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dean Sharma',
        email: 'dean.admin@pict.edu',
        password: 'DeanAdmin@123',
        role: 'college_admin',
        enrollmentNumber: 'PICT-ADM-001',
        department: 'Academic Affairs'
      })
    });
    const adminData = await adminRes.json();
    assert(adminRes.status === 201, 'College Admin registered with status 201', adminData);
    assert(adminData.user.role === 'college_admin', 'Admin role is "college_admin"');

    console.log('\n=========================================');
    console.log(' SECTION 2: VALIDATION & DUPLICATE CHECKS');
    console.log('=========================================');

    // 4. Duplicate email rejection (HTTP 409)
    const dupEmailRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: 'aarav.student@pict.edu', // duplicate email
        password: 'Password@123',
        role: 'student'
      })
    });
    assert(dupEmailRes.status === 409, 'Rejects duplicate email with HTTP 409 Conflict');

    // 5. Duplicate enrollmentNumber / PRN rejection (HTTP 409)
    const dupPrnRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unique User',
        email: 'unique.user@pict.edu',
        password: 'Password@123',
        role: 'student',
        enrollmentNumber: 'C2K2310001' // duplicate PRN
      })
    });
    assert(dupPrnRes.status === 409, 'Rejects duplicate PRN with HTTP 409 Conflict');

    // 6. Invalid email format (HTTP 400)
    const badEmailRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'Password@123',
        role: 'student'
      })
    });
    assert(badEmailRes.status === 400, 'Rejects invalid email format with HTTP 400');

    // 7. Weak / Short password rejection (HTTP 400)
    const weakPassRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass',
        email: 'short.pass@pict.edu',
        password: '123',
        role: 'student'
      })
    });
    assert(weakPassRes.status === 400, 'Rejects password shorter than 6 characters with HTTP 400');

    // 8. Rejection of SUBHEAD role (strictly forbidden per specifications)
    const subheadRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Subhead Test',
        email: 'subhead@pict.edu',
        password: 'Password@123',
        role: 'subhead' // NOT ALLOWED
      })
    });
    assert(subheadRes.status === 400, 'Strictly rejects "subhead" role with HTTP 400 Bad Request');

    console.log('\n=========================================');
    console.log(' SECTION 3: USER LOGIN');
    console.log('=========================================');

    // 9. Login with email + password
    const loginEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'aarav.student@pict.edu',
        password: 'Password@123'
      })
    });
    const loginEmailData = await loginEmailRes.json();
    assert(loginEmailRes.status === 200, 'Login with email returns HTTP 200', loginEmailData);
    assert(!!loginEmailData.token, 'Login response contains JWT token');
    assert(loginEmailData.user.email === 'aarav.student@pict.edu', 'Returns correct user email');
    assert(!loginEmailData.user.password, 'Password hash is NOT returned on login');

    const studentToken = loginEmailData.token;

    // 10. Login with PRN / enrollmentNumber + password
    const loginPrnRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'C2K2310001', // Student PRN
        password: 'Password@123'
      })
    });
    const loginPrnData = await loginPrnRes.json();
    assert(loginPrnRes.status === 200, 'Login with Student PRN returns HTTP 200', loginPrnData);
    assert(!!loginPrnData.token, 'Login with Student PRN provides valid JWT');

    // 11. Invalid password rejection (HTTP 401)
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'aarav.student@pict.edu',
        password: 'WrongPassword'
      })
    });
    assert(wrongPassRes.status === 401, 'Rejects invalid password with HTTP 401 Unauthorized');

    // 12. Non-existent user rejection (HTTP 401)
    const notFoundRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'nobody@pict.edu',
        password: 'Password@123'
      })
    });
    assert(notFoundRes.status === 401, 'Rejects non-existent user with HTTP 401 Unauthorized');

    // 13. Login rejection on pending status user (HTTP 403)
    const pendingUser = new User({
      name: 'Pending Lead',
      email: 'pending.lead@pict.edu',
      password: 'LeadPassword@123',
      role: 'president',
      status: 'pending'
    });
    await pendingUser.save();

    const pendingLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'pending.lead@pict.edu',
        password: 'LeadPassword@123'
      })
    });
    assert(pendingLoginRes.status === 403, 'Rejects login for pending approval account with HTTP 403 Forbidden');

    console.log('\n=========================================');
    console.log(' SECTION 4: GET CURRENT USER (/me) & JWT VERIFICATION');
    console.log('=========================================');

    // 14. /api/auth/me with valid token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me returns HTTP 200 with valid JWT', meData);
    assert(meData.user.email === 'aarav.student@pict.edu', '/me returns correct user data');
    assert(!meData.user.password, '/me does not leak password');

    // 15. /api/auth/me with missing token (HTTP 401)
    const missingTokenRes = await fetch(`${baseUrl}/api/auth/me`);
    assert(missingTokenRes.status === 401, 'Rejects request with missing JWT with HTTP 401');

    // 16. /api/auth/me with invalid / corrupted token (HTTP 401)
    const invalidTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer this-is-not-a-valid-jwt-token' }
    });
    assert(invalidTokenRes.status === 401, 'Rejects invalid/corrupted JWT with HTTP 401');

    // 17. /api/auth/me with expired token (HTTP 401)
    const expiredToken = jwt.sign(
      { id: studentData.user.id, role: 'student', email: 'aarav.student@pict.edu' },
      JWT_TEST_SECRET,
      { expiresIn: '-1s' } // Expired 1 second ago
    );
    const expiredRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(expiredRes.status === 401, 'Rejects expired JWT with HTTP 401 TokenExpiredError');

    console.log('\n=========================================');
    console.log(' SECTION 5: ROLE-BASED ACCESS CONTROL (RBAC)');
    console.log('=========================================');

    const adminToken = adminData.token;
    const presidentToken = presData.token;

    // 18. College Admin accessing Admin-protected route (HTTP 200)
    const adminAccessRes = await fetch(`${baseUrl}/api/auth/test/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAccessRes.status === 200, 'College Admin can access /test/admin (HTTP 200)');

    // 19. Student accessing Admin-protected route (HTTP 403)
    const studentToAdminRes = await fetch(`${baseUrl}/api/auth/test/admin`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentToAdminRes.status === 403, 'Student DENIED access to /test/admin with HTTP 403 Forbidden');

    // 20. Club President accessing President-protected route (HTTP 200)
    const presAccessRes = await fetch(`${baseUrl}/api/auth/test/president`, {
      headers: { Authorization: `Bearer ${presidentToken}` }
    });
    assert(presAccessRes.status === 200, 'Club President can access /test/president (HTTP 200)');

    // 21. Student accessing President-protected route (HTTP 403)
    const studentToPresRes = await fetch(`${baseUrl}/api/auth/test/president`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentToPresRes.status === 403, 'Student DENIED access to /test/president with HTTP 403 Forbidden');

    // 22. Student accessing Student-protected route (HTTP 200)
    const studentAccessRes = await fetch(`${baseUrl}/api/auth/test/student`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentAccessRes.status === 200, 'Student can access /test/student (HTTP 200)');

    // 23. Unauthenticated access to protected route (HTTP 401)
    const unauthRes = await fetch(`${baseUrl}/api/auth/test/admin`);
    assert(unauthRes.status === 401, 'Unauthenticated user rejected from protected route with HTTP 401');

    console.log('\n=========================================');
    console.log(' SECTION 6: LOGOUT');
    console.log('=========================================');

    // 24. Logout endpoint returns 200 OK
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST'
    });
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns HTTP 200 OK');

    console.log('\n=========================================');
    console.log(` ALL ${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('=========================================\n');
  } finally {
    await stopTestEnvironment();
  }
}

runTests().catch((err) => {
  console.error('[Test Suite Error]', err);
  process.exit(1);
});
