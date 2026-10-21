import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
import { Department } from '../src/models/Department.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../src/models/Event.js';
import { EventRegistration, RegistrationAttendanceStatus } from '../src/models/EventRegistration.js';
import { runAtlasUserMigration } from '../src/scripts/migrateAtlasUsers.js';

let mongod: MongoMemoryServer | null = null;
let server: http.Server;
let baseUrl = '';

const JWT_TEST_SECRET = 'test_jwt_secret_campusconnect_schema_compat_12345';
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

// Global Fixture IDs
let adminUserId: mongoose.Types.ObjectId;
let leadStudentId: mongoose.Types.ObjectId;
let regularStudentId: mongoose.Types.ObjectId;
let leadFacultyId: mongoose.Types.ObjectId;
let neutralFacultyId: mongoose.Types.ObjectId;
let departmentId: mongoose.Types.ObjectId;
let clubId: mongoose.Types.ObjectId;
let venueId: mongoose.Types.ObjectId;
let eventId: mongoose.Types.ObjectId;
let pendingEventId: mongoose.Types.ObjectId;
let registrationId: mongoose.Types.ObjectId;

const KNOWN_BCRYPT_PASSWORD = 'TestPassword@123';
let validBcryptHash = '';

async function startTestEnvironment() {
  console.log('\n[Schema Compatibility Tests] Initializing isolated MongoMemoryServer & HTTP server...');
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`[Schema Compatibility Tests] Isolated server running at ${baseUrl}`);
      resolve();
    });
  });

  const salt = await bcrypt.genSalt(10);
  validBcryptHash = await bcrypt.hash(KNOWN_BCRYPT_PASSWORD, salt);
}

async function seedLegacyFixtures() {
  console.log('\n--- 1. Seeding Legacy Atlas-Style Fixtures ---');
  const db = mongoose.connection.db;

  // 1. Department
  const deptDoc = await Department.create({ name: 'Computer Engineering' });
  departmentId = deptDoc._id as mongoose.Types.ObjectId;

  // 2. Club
  const clubDoc = await Club.create({
    name: 'PICT ACM Student Chapter',
    shortName: 'ACM',
    description: 'Technical computing society',
    category: ClubCategory.TECHNICAL,
    status: ClubStatus.ACTIVE
  });
  clubId = clubDoc._id as mongoose.Types.ObjectId;

  // 3. Insert Legacy User documents directly via native driver (simulating raw Atlas state)
  adminUserId = new mongoose.Types.ObjectId();
  leadStudentId = new mongoose.Types.ObjectId();
  regularStudentId = new mongoose.Types.ObjectId();
  leadFacultyId = new mongoose.Types.ObjectId();
  neutralFacultyId = new mongoose.Types.ObjectId();

  await db.collection('users').insertMany([
    {
      _id: adminUserId,
      fullName: 'Super Administrator',
      email: 'admin.super@campusconnect.edu',
      passwordHash: validBcryptHash,
      userType: 'ADMIN',
      employeeId: 'ADM-901',
      isActive: true
    },
    {
      _id: leadStudentId,
      fullName: 'Aarav Patil',
      email: 'aarav.lead@campusconnect.edu',
      passwordHash: validBcryptHash,
      userType: 'STUDENT',
      prn: 'PRN-101',
      departmentId,
      year: 'TE',
      isActive: true
    },
    {
      _id: regularStudentId,
      fullName: 'Ananya Sharma',
      email: 'ananya.member@campusconnect.edu',
      passwordHash: 'DEMO_HASH_REPLACE_BEFORE_AUTH_TESTING', // Unmigrated dummy placeholder
      userType: 'STUDENT',
      prn: 'PRN-102',
      departmentId,
      year: 'SE',
      isActive: true
    },
    {
      _id: leadFacultyId,
      fullName: 'Dr. Meera Kulkarni',
      email: 'meera.faculty@campusconnect.edu',
      passwordHash: validBcryptHash,
      userType: 'FACULTY',
      employeeId: 'FAC-301',
      departmentId,
      isActive: true
    },
    {
      _id: neutralFacultyId,
      fullName: 'Prof. Neutral Faculty',
      email: 'neutral.faculty@campusconnect.edu',
      passwordHash: validBcryptHash,
      userType: 'FACULTY',
      employeeId: 'FAC-999',
      departmentId,
      isActive: true
    }
  ]);

  // 4. Club Memberships
  await ClubMembership.create([
    {
      clubId,
      userId: leadStudentId,
      role: ClubMembershipRole.LEAD,
      designation: 'Chairperson',
      isActive: true
    },
    {
      clubId,
      userId: leadFacultyId,
      role: ClubMembershipRole.LEAD,
      designation: 'Faculty Sponsor',
      isActive: true
    },
    {
      clubId,
      userId: regularStudentId,
      role: ClubMembershipRole.MEMBER,
      designation: 'Technical Member',
      isActive: true
    }
  ]);

  // 5. Venue & Events
  const venueDoc = await Venue.create({
    name: 'Innovation Hall',
    building: 'Main Block',
    floor: '2nd Floor',
    capacity: 120,
    operationalStatus: VenueOperationalStatus.OPERATIONAL
  });
  venueId = venueDoc._id as mongoose.Types.ObjectId;

  const eventDoc = await Event.create({
    title: 'ACM CodeStorm 2026',
    eventType: 'Hackathon',
    category: EventCategory.CLUB,
    date: new Date('2026-11-20'),
    startTime: '10:00',
    endTime: '17:00',
    venueId,
    clubId,
    proposedBy: leadStudentId,
    registrationRequired: true,
    registrationMethod: RegistrationMethod.CAMPUSCONNECT,
    status: EventStatus.APPROVED
  });
  eventId = eventDoc._id as mongoose.Types.ObjectId;

  const pendingEventDoc = await Event.create({
    title: 'ACM AI Symposium 2026',
    eventType: 'Seminar',
    category: EventCategory.CLUB,
    date: new Date('2026-12-05'),
    startTime: '14:00',
    endTime: '16:00',
    venueId,
    clubId,
    proposedBy: leadStudentId,
    registrationRequired: true,
    registrationMethod: RegistrationMethod.CAMPUSCONNECT,
    status: EventStatus.PENDING_APPROVAL
  });
  pendingEventId = pendingEventDoc._id as mongoose.Types.ObjectId;

  // 6. Registration referencing leadStudentId and regularStudentId
  const regDoc = await EventRegistration.create({
    eventId,
    studentId: regularStudentId,
    studentEnrollment: 'PRN-102',
    attendanceStatus: RegistrationAttendanceStatus.REGISTERED
  });
  registrationId = regDoc._id as mongoose.Types.ObjectId;

  assert(true, 'Legacy Atlas fixtures seeded successfully');
}

async function testPasswordSecurityAndPlaceholderRejection() {
  console.log('\n--- 2. Password Security & Placeholder Rejection ---');

  // Attempt to login with an unmigrated account containing the legacy placeholder hash
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'ananya.member@campusconnect.edu',
      password: 'AnyPasswordAttempt'
    })
  });

  assert(res.status === 401, 'Unmigrated user with DEMO_HASH placeholder receives 401 Unauthorized');
  const data = await res.json();
  assert(data.success === false, 'Response success is false');
  assert(data.message === 'Invalid credentials.', 'Error message is sanitized');

  // Attempt with empty password
  const resEmpty = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'ananya.member@campusconnect.edu',
      password: ''
    })
  });
  assert(resEmpty.status === 400, 'Empty password returns 400 Bad Request');
}

async function testLegacyMultiIdentifierLogin() {
  console.log('\n--- 3. Multi-Identifier Login (Email, PRN, EmployeeId) ---');

  // 1. Login by Email
  const resEmail = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin.super@campusconnect.edu',
      password: KNOWN_BCRYPT_PASSWORD
    })
  });
  assert(resEmail.status === 200, 'Login by Email returns 200 OK');
  const dataEmail = await resEmail.json();
  assert(!!dataEmail.token, 'Token returned on email login');
  assert(dataEmail.user.name === 'Super Administrator', 'User name correctly resolved from fullName');
  assert(dataEmail.user.role === 'college_admin', 'Role correctly resolved to college_admin');

  // 2. Login by Student PRN
  const resPrn = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'PRN-101',
      password: KNOWN_BCRYPT_PASSWORD
    })
  });
  assert(resPrn.status === 200, 'Login by student PRN returns 200 OK');
  const dataPrn = await resPrn.json();
  assert(dataPrn.user.email === 'aarav.lead@campusconnect.edu', 'Correct student returned for PRN');

  // 3. Case-Insensitive PRN Login
  const resPrnLower = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'prn-101',
      password: KNOWN_BCRYPT_PASSWORD
    })
  });
  assert(resPrnLower.status === 200, 'Case-insensitive PRN login returns 200 OK');

  // 4. Login by Employee ID
  const resEmp = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'ADM-901',
      password: KNOWN_BCRYPT_PASSWORD
    })
  });
  assert(resEmp.status === 200, 'Login by employeeId returns 200 OK');

  // 5. Regex Injection Safety Test
  const resRegexInject = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'PRN.*',
      password: KNOWN_BCRYPT_PASSWORD
    })
  });
  assert(resRegexInject.status === 401, 'Wildcard / regex injection in identifier is safely escaped and returns 401');
}

async function testMigrationDryRun() {
  console.log('\n--- 4. Migration Script Dry-Run Verification ---');

  const summary = await runAtlasUserMigration({
    isDryRun: true,
    initialPassword: KNOWN_BCRYPT_PASSWORD,
    silent: true
  });

  assert(summary.mode === 'DRY_RUN', 'Dry-run returns DRY_RUN mode');
  assert(summary.totalUsersFound === 5, 'Found all 5 test users');
  assert(summary.preservedIdsCount === 5, 'Preserved all 5 user IDs');
  assert(summary.rolesMapped.college_admin === 1, 'Mapped 1 college_admin');
  assert(summary.rolesMapped.president === 2, 'Mapped 2 presidents (Aarav & Dr. Meera verified active leads)');
  assert(summary.rolesMapped.student === 2, 'Mapped 2 students (Ananya member & Prof. Neutral non-lead)');
  assert(summary.passwordsUpgradedCount === 1, 'Identified 1 placeholder password to upgrade');
  assert(summary.uniquenessPassed === true, 'Unique index validation passed');
  assert(summary.referentialIntegrityPassed === true, 'Referential integrity check passed');

  // Verify 0 database modifications occurred during dry-run
  const rawAnanya = await mongoose.connection.db.collection('users').findOne({ _id: regularStudentId });
  assert(
    rawAnanya?.passwordHash === 'DEMO_HASH_REPLACE_BEFORE_AUTH_TESTING',
    'Dry-run performed ZERO writes; placeholder remains untouched'
  );
}

async function testExecuteMigration() {
  console.log('\n--- 5. Confirmed Migration Execution ---');

  const summary = await runAtlasUserMigration({
    isDryRun: false,
    initialPassword: KNOWN_BCRYPT_PASSWORD,
    silent: true
  });

  assert(summary.mode === 'PRODUCTION_APPLIED', 'Migration ran in PRODUCTION_APPLIED mode');

  // Verify that Ananya's password was upgraded to valid bcrypt hash
  const rawAnanya = await mongoose.connection.db.collection('users').findOne({ _id: regularStudentId });
  assert(
    typeof rawAnanya?.password === 'string' && rawAnanya.password.startsWith('$2'),
    'Placeholder password upgraded to valid bcrypt hash'
  );

  // Verify role mapping on user documents
  const rawAarav = await mongoose.connection.db.collection('users').findOne({ _id: leadStudentId });
  assert(rawAarav?.role === 'president', 'Aarav (active lead) updated to role: president');
  assert(rawAarav?.clubId === clubId.toString(), 'Aarav clubId properly linked');

  const rawNeutral = await mongoose.connection.db.collection('users').findOne({ _id: neutralFacultyId });
  assert(
    rawNeutral?.role === 'student',
    'Faculty member without active club leadership is assigned student role, NOT president'
  );
}

async function testPostMigrationRoleBoundaries() {
  console.log('\n--- 6. Post-Migration Role Boundaries & Authenticated Actions ---');

  // 1. Ananya can now log in successfully with KNOWN_BCRYPT_PASSWORD
  const resAnanyaLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'ananya.member@campusconnect.edu',
      password: KNOWN_BCRYPT_PASSWORD
    })
  });
  assert(resAnanyaLogin.status === 200, 'Upgraded user can now authenticate with valid bcrypt password');
  const ananyaToken = (await resAnanyaLogin.json()).token;

  // 2. Login as Admin
  const resAdmin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin.super@campusconnect.edu',
      password: KNOWN_BCRYPT_PASSWORD
    })
  });
  const adminToken = (await resAdmin.json()).token;

  // 3. Login as Aarav (Club Lead)
  const resLead = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'aarav.lead@campusconnect.edu',
      password: KNOWN_BCRYPT_PASSWORD
    })
  });
  const leadToken = (await resLead.json()).token;

  // 4. Login as Neutral Faculty
  const resNeutral = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'neutral.faculty@campusconnect.edu',
      password: KNOWN_BCRYPT_PASSWORD
    })
  });
  const neutralToken = (await resNeutral.json()).token;

  // Admin approves pending event: 200 OK
  const resApprove = await fetch(`${baseUrl}/api/events/${pendingEventId}/approve`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comments: 'Approved by admin' })
  });
  assert(resApprove.status === 200, 'Admin can approve pending event');

  // Lead accesses event registrations: 200 OK
  const resLeadRegs = await fetch(`${baseUrl}/api/events/${eventId}/registrations`, {
    headers: { Authorization: `Bearer ${leadToken}` }
  });
  assert(resLeadRegs.status === 200, 'Active Club Lead can access event registrations');

  // Student is forbidden from lead registrations: 403 Forbidden
  const resStudentForbidden = await fetch(`${baseUrl}/api/events/${eventId}/registrations`, {
    headers: { Authorization: `Bearer ${ananyaToken}` }
  });
  assert(resStudentForbidden.status === 403, 'Regular student is forbidden (403) from accessing event registrations');

  // Neutral Faculty is forbidden from lead registrations: 403 Forbidden
  const resNeutralForbidden = await fetch(`${baseUrl}/api/events/${eventId}/registrations`, {
    headers: { Authorization: `Bearer ${neutralToken}` }
  });
  assert(resNeutralForbidden.status === 403, 'Non-lead faculty is forbidden (403) from accessing event registrations');
}

async function testExistingIdPreservationAndDepartmentResolution() {
  console.log('\n--- 7. Existing ID Preservation & Department Resolution ---');

  // Verify that User._id remains identical
  const aarav = await User.findById(leadStudentId);
  assert(!!aarav, 'Aarav found by original ObjectId');
  assert(aarav?._id.toString() === leadStudentId.toString(), 'Original _id preserved exactly');

  // Verify that Event proposedBy still matches
  const event = await Event.findById(eventId);
  assert(event?.proposedBy?.toString() === leadStudentId.toString(), 'Event proposedBy relationship preserved');

  // Verify that Registration studentId still matches
  const reg = await EventRegistration.findById(registrationId);
  assert(reg?.studentId?.toString() === regularStudentId.toString(), 'Registration studentId relationship preserved');

  // Verify Department Resolution
  assert(aarav?.departmentId?.toString() === departmentId.toString(), 'departmentId reference preserved');
  assert(aarav?.department === 'Computer Engineering', 'Department string resolved from departments collection');
}

async function teardown() {
  console.log('\n[Schema Compatibility Tests] Tearing down test environment...');
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
}

async function run() {
  try {
    await startTestEnvironment();
    await seedLegacyFixtures();
    await testPasswordSecurityAndPlaceholderRejection();
    await testLegacyMultiIdentifierLogin();
    await testMigrationDryRun();
    await testExecuteMigration();
    await testPostMigrationRoleBoundaries();
    await testExistingIdPreservationAndDepartmentResolution();

    console.log('\n======================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} USER SCHEMA COMPATIBILITY TESTS PASSED!`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ Compatibility test suite failed:', err.message);
    process.exitCode = 1;
  } finally {
    await teardown();
  }
}

run();
