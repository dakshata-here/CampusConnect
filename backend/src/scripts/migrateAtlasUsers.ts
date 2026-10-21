import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

dotenv.config();

// Ensure custom DNS servers for Windows SRV queries if needed
if (process.env.MONGODB_URI?.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (err) {
    // Ignore DNS error
  }
}

export interface MigrationSummary {
  totalUsersFound: number;
  preservedIdsCount: number;
  rolesMapped: {
    college_admin: number;
    president: number;
    student: number;
  };
  departmentsResolvedCount: number;
  passwordsUpgradedCount: number;
  uniquenessPassed: boolean;
  referentialIntegrityPassed: boolean;
  mode: 'DRY_RUN' | 'PRODUCTION_APPLIED';
}

export async function runAtlasUserMigration(options: {
  isDryRun: boolean;
  initialPassword?: string;
  uniqueTemporaryPasswords?: boolean;
  silent?: boolean;
}): Promise<MigrationSummary> {
  const {
    isDryRun,
    initialPassword,
    uniqueTemporaryPasswords = true,
    silent = false
  } = options;

  let db = mongoose.connection.db;
  let shouldDisconnect = false;

  if (mongoose.connection.readyState !== 1 || !db) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }
    const conn = await mongoose.connect(mongoUri);
    db = conn.connection.db;
    shouldDisconnect = true;
  }

  if (!db) {
    throw new Error('Database connection failed to establish.');
  }

  try {
    if (!silent) {
      console.log('======================================================');
      console.log(` CampusConnect User Schema Migration (${isDryRun ? 'DRY RUN' : 'PRODUCTION'})`);
      console.log('======================================================');
    }

    // 1. Gather Departments
    const departments = await db.collection('departments').find({}).toArray();
    const deptMap = Object.fromEntries(departments.map((d: any) => [d._id.toString(), d.name]));

    // 2. Gather Clubs
    const clubs = await db.collection('clubs').find({}).toArray();
    const clubMap = Object.fromEntries(clubs.map((c: any) => [c._id.toString(), c]));

    // 3. Gather Active Club Lead Memberships
    const activeLeadMemberships = await db
      .collection('clubmemberships')
      .find({
        role: 'LEAD',
        $or: [{ isActive: true }, { isActive: { $exists: false } }]
      })
      .toArray();

    // Map userId -> array of lead clubIds
    const userLeadClubsMap = new Map<string, string[]>();
    for (const m of activeLeadMemberships) {
      const uId = m.userId?.toString();
      const cId = m.clubId?.toString();
      if (uId && cId) {
        if (!userLeadClubsMap.has(uId)) {
          userLeadClubsMap.set(uId, []);
        }
        userLeadClubsMap.get(uId)!.push(cId);
      }
    }

    // 4. Gather Existing Users
    const users = await db.collection('users').find({}).toArray();
    const summary: MigrationSummary = {
      totalUsersFound: users.length,
      preservedIdsCount: 0,
      rolesMapped: {
        college_admin: 0,
        president: 0,
        student: 0
      },
      departmentsResolvedCount: 0,
      passwordsUpgradedCount: 0,
      uniquenessPassed: true,
      referentialIntegrityPassed: true,
      mode: isDryRun ? 'DRY_RUN' : 'PRODUCTION_APPLIED'
    };

    const plannedUpdates: Array<{
      id: string;
      filter: { _id: any };
      update: { $set: Record<string, any> };
      sanitizedAudit: Record<string, any>;
    }> = [];

    const seenEmails = new Set<string>();
    const seenEnrollments = new Set<string>();

    // Passwords requiring upgrade will receive individual salts and hashes per user

    for (const u of users) {
      summary.preservedIdsCount++;
      const userIdStr = u._id.toString();

      // Check Email Uniqueness
      const emailLower = (u.email || '').trim().toLowerCase();
      if (seenEmails.has(emailLower)) {
        summary.uniquenessPassed = false;
        throw new Error(`Duplicate email detected during migration: ${emailLower}`);
      }
      seenEmails.add(emailLower);

      // Resolve Name
      const resolvedName = (u.name || u.fullName || '').trim();

      // Resolve Enrollment Number / PRN / Employee ID
      const resolvedEnrollment = (u.enrollmentNumber || u.prn || u.employeeId || '').trim();
      if (resolvedEnrollment) {
        if (seenEnrollments.has(resolvedEnrollment.toLowerCase())) {
          summary.uniquenessPassed = false;
          throw new Error(`Duplicate enrollment/PRN detected during migration: ${resolvedEnrollment}`);
        }
        seenEnrollments.add(resolvedEnrollment.toLowerCase());
      }

      // Resolve Department
      let resolvedDept = (u.department || '').trim();
      if (!resolvedDept && u.departmentId && deptMap[u.departmentId.toString()]) {
        resolvedDept = deptMap[u.departmentId.toString()];
        summary.departmentsResolvedCount++;
      } else if (resolvedDept) {
        summary.departmentsResolvedCount++;
      }

      // Role Mapping
      let targetRole: 'college_admin' | 'president' | 'student' = 'student';
      let targetClubId: string | undefined = undefined;
      let targetClubName: string | undefined = undefined;

      const rawUserType = String(u.userType || '').toUpperCase();
      const existingRole = String(u.role || '').toLowerCase();

      if (rawUserType === 'ADMIN' || existingRole === 'college_admin') {
        targetRole = 'college_admin';
        summary.rolesMapped.college_admin++;
      } else {
        // Check verified active club lead membership
        const leadClubIds = userLeadClubsMap.get(userIdStr);
        if (leadClubIds && leadClubIds.length > 0) {
          targetRole = 'president';
          targetClubId = leadClubIds[0];
          targetClubName = clubMap[targetClubId]?.name || 'Student Club';
          summary.rolesMapped.president++;
        } else {
          targetRole = 'student';
          summary.rolesMapped.student++;
        }
      }

      // Password Upgrade Check (Bcrypt compatible only)
      let needsPasswordUpgrade = false;
      const currentPassword = u.password;
      const currentPasswordHash = u.passwordHash;

      const hasValidBcrypt =
        (typeof currentPassword === 'string' && currentPassword.startsWith('$2')) ||
        (typeof currentPasswordHash === 'string' && currentPasswordHash.startsWith('$2'));

      if (!hasValidBcrypt) {
        needsPasswordUpgrade = true;
        summary.passwordsUpgradedCount++;
      }

      const updateSet: Record<string, any> = {
        name: resolvedName,
        fullName: u.fullName || resolvedName,
        enrollmentNumber: resolvedEnrollment,
        department: resolvedDept,
        role: targetRole,
        status: 'active',
        avatar: u.avatar || u.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        updatedAt: new Date()
      };

      if (targetClubId) updateSet.clubId = targetClubId;
      if (targetClubName) updateSet.clubName = targetClubName;
      if (needsPasswordUpgrade) {
        let candidateRaw = initialPassword;
        if (!candidateRaw) {
          candidateRaw = `Tmp#${crypto.randomBytes(6).toString('hex')}9!`;
        }
        const userSalt = await bcrypt.genSalt(10);
        const userHash = await bcrypt.hash(candidateRaw, userSalt);
        updateSet.password = userHash;
        updateSet.passwordHash = userHash;
        updateSet.mustChangePassword = true;
      }

      plannedUpdates.push({
        id: userIdStr,
        filter: { _id: u._id },
        update: { $set: updateSet },
        sanitizedAudit: {
          id: userIdStr,
          role: targetRole,
          hasClub: !!targetClubId,
          departmentResolved: !!resolvedDept,
          passwordUpgradedToBcrypt: needsPasswordUpgrade
        }
      });
    }

    // 5. Referential Integrity Check
    const userIdsSet = new Set(users.map((u: any) => u._id.toString()));
    const registrations = await db.collection('eventregistrations').find({}).toArray();
    for (const r of registrations) {
      if (r.studentId && !userIdsSet.has(r.studentId.toString())) {
        summary.referentialIntegrityPassed = false;
        throw new Error(`Referential integrity failure: orphaned registration found for studentId ${r.studentId}`);
      }
    }

    if (!silent) {
      console.log(`\n--- Plan Summary ---`);
      console.log(`Total users inspected: ${summary.totalUsersFound}`);
      console.log(`User IDs strictly preserved: ${summary.preservedIdsCount}/${summary.totalUsersFound}`);
      console.log(`Roles to be configured:`);
      console.log(`  - college_admin: ${summary.rolesMapped.college_admin}`);
      console.log(`  - president (active lead verified): ${summary.rolesMapped.president}`);
      console.log(`  - student: ${summary.rolesMapped.student}`);
      console.log(`Departments resolved from departments collection: ${summary.departmentsResolvedCount}`);
      console.log(`Legacy placeholder passwords to upgrade with bcrypt: ${summary.passwordsUpgradedCount}`);
      console.log(`Unique index validations: ${summary.uniquenessPassed ? 'PASSED' : 'FAILED'}`);
      console.log(`Registration referential integrity: ${summary.referentialIntegrityPassed ? 'PASSED' : 'FAILED'}`);
    }

    // 6. Execute if NOT Dry Run
    if (!isDryRun) {
      if (!silent) console.log('\nExecuting non-destructive in-place $set migration on Atlas...');
      for (const item of plannedUpdates) {
        await db.collection('users').updateOne(item.filter, item.update);
      }
      if (!silent) console.log('Successfully applied all in-place user updates.');
    } else {
      if (!silent) {
        console.log('\n[DRY RUN COMPLETE] Zero database writes performed.');
        console.log('To apply in production, database owner approval and --confirm-production-migration are required.');
      }
    }

    return summary;
  } finally {
    if (shouldDisconnect) {
      await mongoose.disconnect();
    }
  }
}

// Direct CLI Execution
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()
) {
  const args = process.argv.slice(2);
  const isConfirmed = args.includes('--confirm-production-migration');
  const isDryRun = !isConfirmed || args.includes('--dry-run');

  runAtlasUserMigration({ isDryRun })
    .then((summary) => {
      console.log('\nMigration run finished with mode:', summary.mode);
      process.exit(0);
    })
    .catch((err) => {
      console.error('\nMigration failed:', err.message);
      process.exit(1);
    });
}
