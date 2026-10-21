import http from 'http';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { User, UserRole } from '../src/models/User.js';
import { generateToken } from '../src/utils/jwt.js';

let mongod: MongoMemoryServer | null = null;
let server: http.Server;
let baseUrl = '';

const JWT_TEST_SECRET = 'test_jwt_secret_credential_security_98765';
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

async function request(path: string, options: {
  method?: string;
  token?: string;
  body?: any;
} = {}): Promise<{ status: number; body: any }> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = res.headers.get('content-type') || '';
  let body: any;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, body };
}

async function runCredentialSecurityTestSuite() {
  console.log('================================================================');
  console.log(' CampusConnect — Credential Security & Recovery Test Suite');
  console.log('================================================================\n');

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        console.log(`[Test Server] Isolated test instance running at ${baseUrl}\n`);
        resolve();
      });
    });

    // -------------------------------------------------------------
    // SECTION 1: Fixture Setup with Temporary & Permanent Credentials
    // -------------------------------------------------------------
    console.log('--- 1. Setting up Test Users in Isolated In-Memory Database ---');

    const tempPasswordRaw = 'TempPass@123';

    // User A: Student with temporary credentials (mustChangePassword: true)
    const userA = new User({
      name: 'Pooja Verma',
      email: 'pooja.student@pict.edu',
      password: tempPasswordRaw,
      role: UserRole.STUDENT,
      enrollmentNumber: 'C2K2310888',
      department: 'Computer Engineering',
      status: 'active',
      mustChangePassword: true
    });
    await userA.save();

    // User B: College Administrator (permanent credentials)
    const adminPasswordRaw = 'PictAdmin@2026';

    const userAdmin = new User({
      name: 'Prof. S. R. Joshi',
      email: 'admin.joshi@pict.edu',
      password: adminPasswordRaw,
      role: UserRole.COLLEGE_ADMIN,
      enrollmentNumber: 'PICT-ADM-108',
      department: 'Administration',
      status: 'active',
      mustChangePassword: false
    });
    await userAdmin.save();

    // User C: Student with permanent credentials
    const studentCPasswordRaw = 'PermPass@2026';

    const userC = new User({
      name: 'Aditya Kulkarni',
      email: 'aditya.lead@pict.edu',
      password: studentCPasswordRaw,
      role: UserRole.CLUB_PRESIDENT,
      enrollmentNumber: 'C2K2210012',
      department: 'Computer Engineering',
      status: 'active',
      mustChangePassword: false
    });
    await userC.save();

    assert(true, 'Test users seeded in isolated database');

    // -------------------------------------------------------------
    // SECTION 2: Mandatory Password Change Enforcement
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Mandatory Password Change Enforcement ---');

    // Login User A with temporary password
    const loginARes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'pooja.student@pict.edu',
        password: tempPasswordRaw
      }
    });

    assert(loginARes.status === 200, 'User A login succeeds with temporary credential');
    assert(loginARes.body.mustChangePassword === true, 'Response indicates mustChangePassword === true');
    const tokenA = loginARes.body.token;

    // Protected Route Access should be BLOCKED with HTTP 403
    const protectedEventsRes = await request('/api/events', {
      method: 'GET',
      token: tokenA
    });

    assert(protectedEventsRes.status === 403, 'Access to /api/events blocked for user with mustChangePassword');
    assert(protectedEventsRes.body.mustChangePassword === true, '403 error payload contains mustChangePassword: true');

    // Non-protected auth routes should remain accessible
    const meRes = await request('/api/auth/me', {
      method: 'GET',
      token: tokenA
    });
    assert(meRes.status === 200, 'Access to /api/auth/me permitted during mandatory change');
    assert(meRes.body.user.mustChangePassword === true, '/api/auth/me reflects mustChangePassword state');

    // -------------------------------------------------------------
    // SECTION 3: Password Change Validation & Unblocking
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Password Change Validation & Complexity ---');

    // A. Rejects incorrect current password
    const badCurrentRes = await request('/api/auth/change-password', {
      method: 'POST',
      token: tokenA,
      body: {
        currentPassword: 'WrongPassword@123',
        newPassword: 'BrandNewPassword@2026'
      }
    });
    assert(badCurrentRes.status === 401, 'Rejects incorrect current password (HTTP 401)');

    // B. Rejects password < 8 characters
    const tooShortRes = await request('/api/auth/change-password', {
      method: 'POST',
      token: tokenA,
      body: {
        currentPassword: tempPasswordRaw,
        newPassword: 'Short1!'
      }
    });
    assert(tooShortRes.status === 400, 'Rejects password shorter than 8 characters (HTTP 400)');

    // C. Rejects password without alphanumeric mix
    const noNumberRes = await request('/api/auth/change-password', {
      method: 'POST',
      token: tokenA,
      body: {
        currentPassword: tempPasswordRaw,
        newPassword: 'JustLettersHere'
      }
    });
    assert(noNumberRes.status === 400, 'Rejects password lacking numbers (HTTP 400)');

    // D. Rejects password identical to current
    const samePasswordRes = await request('/api/auth/change-password', {
      method: 'POST',
      token: tokenA,
      body: {
        currentPassword: tempPasswordRaw,
        newPassword: tempPasswordRaw
      }
    });
    assert(samePasswordRes.status === 400, 'Rejects new password identical to current password (HTTP 400)');

    // E. Successful Password Change
    const validNewPassword = 'StrongPermanent@2026';
    const changeSuccessRes = await request('/api/auth/change-password', {
      method: 'POST',
      token: tokenA,
      body: {
        currentPassword: tempPasswordRaw,
        newPassword: validNewPassword
      }
    });

    assert(changeSuccessRes.status === 200, 'Password successfully updated (HTTP 200)');
    assert(changeSuccessRes.body.token !== undefined, 'Returns fresh JWT token');
    const freshTokenA = changeSuccessRes.body.token;

    // Verify User A in DB has mustChangePassword === false and passwordChangedAt set
    const updatedUserA = await User.findById(userA._id);
    assert(updatedUserA?.mustChangePassword === false, 'user.mustChangePassword flag cleared in database');
    assert(updatedUserA?.passwordChangedAt !== undefined, 'user.passwordChangedAt timestamp recorded');

    // Fresh token can now access protected application features!
    const unblockedEventsRes = await request('/api/events', {
      method: 'GET',
      token: freshTokenA
    });
    assert(unblockedEventsRes.status === 200, 'Protected route /api/events now accessible after password change');

    // -------------------------------------------------------------
    // SECTION 4: Session Invalidation for Pre-existing JWTs
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Session Invalidation (Revocation of Old Sessions) ---');

    // User C logs in and obtains token
    const loginCRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'aditya.lead@pict.edu',
        password: studentCPasswordRaw
      }
    });
    assert(loginCRes.status === 200, 'User C login successful');
    const oldTokenC = loginCRes.body.token;

    // Verify oldTokenC works
    const oldAccessRes = await request('/api/events', {
      method: 'GET',
      token: oldTokenC
    });
    assert(oldAccessRes.status === 200, 'Initial token for User C is valid');

    // Wait 1.1 seconds so time advances past JWT iat second precision
    await new Promise((r) => setTimeout(r, 1100));

    // User C changes password
    const newPasswordC = 'AdityaNewPass#2026';
    const changeCRes = await request('/api/auth/change-password', {
      method: 'POST',
      token: oldTokenC,
      body: {
        currentPassword: studentCPasswordRaw,
        newPassword: newPasswordC
      }
    });
    assert(changeCRes.status === 200, 'User C password changed successfully');
    const freshTokenC = changeCRes.body.token;

    // The OLD token (issued prior to passwordChangedAt) should now be REJECTED with HTTP 401
    const revokedRes = await request('/api/events', {
      method: 'GET',
      token: oldTokenC
    });
    assert(revokedRes.status === 401, 'Old session token is invalidated (HTTP 401) after password change');

    // The NEW token succeeds
    const newAccessRes = await request('/api/events', {
      method: 'GET',
      token: freshTokenC
    });
    assert(newAccessRes.status === 200, 'Fresh session token succeeds after password change');

    // -------------------------------------------------------------
    // SECTION 5: Forgot Password (Request Logging & Anti-Enumeration)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Forgot Password Request Flow & Anti-Enumeration ---');

    // Non-existent user
    const unknownForgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { identifier: 'nobody@pict.edu' }
    });
    assert(unknownForgotRes.status === 200, 'Non-existent identifier returns generic 200 (anti-enumeration)');
    assert(unknownForgotRes.body.requiresAdminIssuance === true, 'States admin issuance required');

    // Existing user
    const knownForgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { identifier: 'pooja.student@pict.edu' }
    });
    assert(knownForgotRes.status === 200, 'Existing user request logged with same generic 200');

    // Verify single-use hashed token stored in DB for User A
    const userAWithToken = await User.findById(userA._id).select('+resetPasswordToken +resetPasswordExpires');
    assert(typeof userAWithToken?.resetPasswordToken === 'string', 'Hashed reset token generated and stored');
    assert(userAWithToken?.resetPasswordExpires !== undefined, 'Reset token expiry date stored');

    // -------------------------------------------------------------
    // SECTION 6: Administrator-Managed Token Issuance (RBAC)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Administrator-Managed Token Issuance ---');

    // Login Admin
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'admin.joshi@pict.edu',
        password: adminPasswordRaw
      }
    });
    assert(adminLoginRes.status === 200, 'College Admin login successful');
    const adminToken = adminLoginRes.body.token;

    // Student (User C) attempts to issue reset token -> Blocked (HTTP 403)
    const unauthorizedIssueRes = await request('/api/auth/admin-issue-reset-token', {
      method: 'POST',
      token: freshTokenC,
      body: { targetIdentifier: 'pooja.student@pict.edu' }
    });
    assert(unauthorizedIssueRes.status === 403, 'Non-admin user blocked from issuing reset tokens (HTTP 403)');

    // Admin issues token for User A
    const adminIssueRes = await request('/api/auth/admin-issue-reset-token', {
      method: 'POST',
      token: adminToken,
      body: { targetIdentifier: 'pooja.student@pict.edu' }
    });

    assert(adminIssueRes.status === 200, 'College Admin successfully issues reset token (HTTP 200)');
    assert(adminIssueRes.body.resetToken !== undefined, 'Returns raw single-use reset token');
    assert(adminIssueRes.body.expiresInMinutes === 15, 'Token explicitly specifies 15-minute expiry');
    const issuedResetToken = adminIssueRes.body.resetToken;

    // -------------------------------------------------------------
    // SECTION 7: Password Reset Execution (Token Expiry & Single-Use)
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Reset Verification, Token Expiry, and Single-Use ---');

    // A. Rejects invalid or nonexistent token
    const fakeTokenRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: 'this_is_a_completely_fake_token_that_does_not_exist_in_db_1234',
        newPassword: 'BrandNewPass#999'
      }
    });
    assert(fakeTokenRes.status === 400, 'Rejects invalid or unissued reset token (HTTP 400)');

    // B. Rejects password failing complexity
    const weakResetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: issuedResetToken,
        newPassword: 'short'
      }
    });
    assert(weakResetRes.status === 400, 'Rejects short password during reset (HTTP 400)');

    // C. Test Token Expiry (Set user expiry to past date)
    const userForExpiry = await User.findById(userA._id);
    if (userForExpiry) {
      userForExpiry.resetPasswordExpires = new Date(Date.now() - 60 * 1000); // 1 minute in the past
      await userForExpiry.save();
    }

    const expiredTokenRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: issuedResetToken,
        newPassword: 'BrandNewPass#999'
      }
    });
    assert(expiredTokenRes.status === 400, 'Rejects expired reset token (HTTP 400)');

    // D. Re-issue fresh token for User A
    const freshAdminIssueRes = await request('/api/auth/admin-issue-reset-token', {
      method: 'POST',
      token: adminToken,
      body: { targetIdentifier: 'pooja.student@pict.edu' }
    });
    const validResetToken = freshAdminIssueRes.body.resetToken;

    // E. Reset password successfully
    const finalNewPassword = 'PoojaResetSecurePass#2026';
    const successfulResetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: validResetToken,
        newPassword: finalNewPassword
      }
    });
    assert(successfulResetRes.status === 200, 'Password successfully reset using verified token (HTTP 200)');

    // F. SINGLE-USE ENFORCEMENT: Attempt to use the SAME token a SECOND time
    const secondUseRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: validResetToken,
        newPassword: 'AnotherPassword#2026'
      }
    });
    assert(secondUseRes.status === 400, 'Single-use enforcement: Token cannot be reused (HTTP 400)');

    // G. Verify User A can now log in with the new password
    const postResetLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'pooja.student@pict.edu',
        password: finalNewPassword
      }
    });
    assert(postResetLoginRes.status === 200, 'User A logs in successfully with new post-reset password');
    assert(postResetLoginRes.body.mustChangePassword === false, 'mustChangePassword remains false post-reset');

    console.log('\n================================================================');
    console.log(` ALL ${passedTests}/${totalTests} CREDENTIAL SECURITY TESTS PASSED`);
    console.log('================================================================\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  }
}

runCredentialSecurityTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
