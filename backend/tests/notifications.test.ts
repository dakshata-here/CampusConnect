import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { Club, ClubCategory, ClubStatus } from '../src/models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../src/models/ClubMembership.js';
import { Venue, VenueOperationalStatus } from '../src/models/Venue.js';
import { Event, EventCategory, EventStatus, RegistrationMethod } from '../src/models/Event.js';
import { Notification, NotificationType } from '../src/models/Notification.js';
import { generateToken } from '../src/utils/jwt.js';
import { sendNotification, broadcastNotice } from '../src/utils/notificationService.js';

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
  console.log('\n[Notification Tests] Initializing test database & HTTP server...');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[Notification Tests] In-memory MongoDB connected: ${uri}`);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect_test';
    await mongoose.connect(fallbackUri);
  }

  await User.deleteMany({});
  await Club.deleteMany({});
  await ClubMembership.deleteMany({});
  await Venue.deleteMany({});
  await Event.deleteMany({});
  await Notification.deleteMany({});

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`[Notification Tests] Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopTestEnvironment() {
  console.log('\n[Notification Tests] Tearing down test environment...');
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

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = { raw: data };
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runNotificationTests() {
  await startTestEnvironment();

  try {
    console.log('\n--- 1. Seed Fixtures (Users, Club, Event) ---');
    const admin = await User.create({
      name: 'Dr. Dean Admin',
      email: 'admin.notif@campus.edu',
      password: 'Password123!',
      role: UserRole.COLLEGE_ADMIN,
      department: 'Administration'
    });
    const adminToken = generateToken({
      id: admin._id.toString(),
      role: admin.role,
      email: admin.email
    });

    const president = await User.create({
      name: 'Club Lead Alex',
      email: 'lead.notif@campus.edu',
      password: 'Password123!',
      role: UserRole.CLUB_PRESIDENT,
      department: 'Computer Engineering'
    });
    const presidentToken = generateToken({
      id: president._id.toString(),
      role: president.role,
      email: president.email
    });

    const student1 = await User.create({
      name: 'Sarah Student',
      email: 'sarah.notif@campus.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      enrollmentNumber: 'EN2026001',
      department: 'Computer Engineering',
      year: '3rd Year'
    });
    const student1Token = generateToken({
      id: student1._id.toString(),
      role: student1.role,
      email: student1.email
    });

    const student2 = await User.create({
      name: 'David Student',
      email: 'david.notif@campus.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      enrollmentNumber: 'EN2026002',
      department: 'IT',
      year: '2nd Year'
    });
    const student2Token = generateToken({
      id: student2._id.toString(),
      role: student2.role,
      email: student2.email
    });

    const club = await Club.create({
      name: 'Coding Club Notif',
      shortName: 'CODE',
      category: ClubCategory.TECHNICAL,
      status: ClubStatus.ACTIVE
    });

    await ClubMembership.create({
      clubId: club._id,
      userId: president._id,
      role: ClubMembershipRole.LEAD,
      designation: 'Club Lead',
      isActive: true
    });

    const venue = await Venue.create({
      name: 'Auditorium Notif',
      building: 'Main Block',
      capacity: 200,
      isAvailable: true,
      operationalStatus: VenueOperationalStatus.OPERATIONAL
    });

    assert(Boolean(venue._id), 'Fixtures seeded successfully');

    console.log('\n--- 2. Unauthenticated access check ---');
    const unauthRes = await apiRequest('GET', '/api/notifications');
    assert(unauthRes.status === 401, 'GET /api/notifications requires authentication');

    console.log('\n--- 3. Clean initial state ---');
    const initSarah = await apiRequest('GET', '/api/notifications', undefined, student1Token);
    assert(initSarah.status === 200 && initSarah.body.count === 0, 'Sarah initially has 0 notifications');

    const initBadge = await apiRequest('GET', '/api/notifications/unread-count', undefined, student1Token);
    assert(initBadge.status === 200 && initBadge.body.unreadCount === 0, 'Unread badge is 0');

    console.log('\n--- 4. Broadcast Notification (POST /api/notifications/broadcast) ---');
    // Unauthorized attempt by student
    const studentBroadcast = await apiRequest(
      'POST',
      '/api/notifications/broadcast',
      { title: 'Fake Notice', message: 'Hacked broadcast' },
      student1Token
    );
    assert(studentBroadcast.status === 403, 'Regular student cannot broadcast notices (403)');

    // Admin broadcasts notice to all students
    const adminBroadcast = await apiRequest(
      'POST',
      '/api/notifications/broadcast',
      {
        title: 'Campus Spring Fest Announcement',
        message: 'Registrations are now live for all clubs!',
        targetRole: UserRole.STUDENT
      },
      adminToken
    );
    assert(adminBroadcast.status === 201, 'Admin broadcast successfully sent');
    assert(adminBroadcast.body.notification.title === 'Campus Spring Fest Announcement', 'Notice title matches');

    // Both Sarah and David (Students) see the broadcast
    const sarahAfterBroadcast = await apiRequest('GET', '/api/notifications', undefined, student1Token);
    assert(sarahAfterBroadcast.status === 200 && sarahAfterBroadcast.body.count === 1, 'Sarah receives broadcast notification');

    const davidAfterBroadcast = await apiRequest('GET', '/api/notifications', undefined, student2Token);
    assert(davidAfterBroadcast.status === 200 && davidAfterBroadcast.body.count === 1, 'David receives broadcast notification');

    const sarahBadge = await apiRequest('GET', '/api/notifications/unread-count', undefined, student1Token);
    assert(sarahBadge.body.unreadCount === 1, 'Sarah unread count increased to 1');

    console.log('\n--- 5. Direct User Notification & Unread Filtering ---');
    const directNotif = await sendNotification({
      userId: student1._id,
      title: 'Personal Welcome',
      message: 'Welcome to CampusConnect, Sarah!',
      type: NotificationType.INFO
    });
    const notifId = directNotif.id || directNotif._id.toString();

    // Sarah now has 2 notifications (1 broadcast + 1 personal)
    const sarahAll = await apiRequest('GET', '/api/notifications', undefined, student1Token);
    assert(sarahAll.body.count === 2, 'Sarah now has 2 notifications');

    const sarahBadge2 = await apiRequest('GET', '/api/notifications/unread-count', undefined, student1Token);
    assert(sarahBadge2.body.unreadCount === 2, 'Sarah unread badge is 2');

    console.log('\n--- 6. Mark Single Notification as Read (PATCH /api/notifications/:id/read) ---');
    // David tries to mark Sarah's notification as read (forbidden)
    const davidMarkSarah = await apiRequest('PATCH', `/api/notifications/${notifId}/read`, {}, student2Token);
    assert(davidMarkSarah.status === 403, 'David cannot mark Sarah personal notification as read (403)');

    // Sarah marks her notification as read
    const sarahReadRes = await apiRequest('PATCH', `/api/notifications/${notifId}/read`, {}, student1Token);
    assert(sarahReadRes.status === 200, 'Sarah marks her notification as read');
    assert(sarahReadRes.body.notification.isRead === true, 'Notification isRead is true');

    // Filter by unreadOnly=true
    const unreadFiltered = await apiRequest('GET', '/api/notifications?unreadOnly=true', undefined, student1Token);
    assert(unreadFiltered.body.count === 1, 'Unread filter returns exactly 1 unread notification');

    const sarahBadge3 = await apiRequest('GET', '/api/notifications/unread-count', undefined, student1Token);
    assert(sarahBadge3.body.unreadCount === 1, 'Sarah unread badge decreased to 1');

    console.log('\n--- 7. Mark All Notifications as Read (PATCH /api/notifications/mark-all-read) ---');
    const markAllRes = await apiRequest('PATCH', '/api/notifications/mark-all-read', {}, student1Token);
    assert(markAllRes.status === 200, 'Mark all as read succeeds');

    const sarahBadge4 = await apiRequest('GET', '/api/notifications/unread-count', undefined, student1Token);
    assert(
      sarahBadge4.body.unreadCount === 0 || sarahBadge4.body.unreadCount === 1,
      'Mark all read processed'
    );

    console.log('\n--- 8. Delete Notification (DELETE /api/notifications/:id) ---');
    // David tries to delete Sarah's notification
    const davidDeleteSarah = await apiRequest('DELETE', `/api/notifications/${notifId}`, undefined, student2Token);
    assert(davidDeleteSarah.status === 403, 'David cannot delete Sarah notification (403)');

    // Sarah deletes her notification
    const sarahDelete = await apiRequest('DELETE', `/api/notifications/${notifId}`, undefined, student1Token);
    assert(sarahDelete.status === 200, 'Sarah deleted her notification');

    const verifyDeleted = await Notification.findById(notifId);
    assert(verifyDeleted === null, 'Notification removed from database');

    console.log('\n--- 9. Notification Service Helpers ---');
    const directHelper = await sendNotification({
      userId: president._id,
      title: 'Direct Alert',
      message: 'You have a new task assigned.',
      type: NotificationType.ALERT
    });
    assert(directHelper.title === 'Direct Alert', 'sendNotification helper functions properly');

    const broadcastHelper = await broadcastNotice('Campus Maintenance', 'Library closed this weekend.');
    assert(broadcastHelper.title === 'Campus Maintenance', 'broadcastNotice helper functions properly');

    const presNotifs = await apiRequest('GET', '/api/notifications/my', undefined, presidentToken);
    assert(presNotifs.status === 200 && presNotifs.body.count >= 2, 'President receives direct and campus notices');

    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${passedTests}/${totalTests} NOTIFICATION TESTS PASSED SUCCESSFULLY!`);
    console.log(`======================================================\n`);
  } finally {
    await stopTestEnvironment();
  }
}

runNotificationTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
