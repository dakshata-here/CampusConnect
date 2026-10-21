import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { User, AllowedRole, ALLOWED_ROLES, UserRole } from '../models/User.js';
import { ClubMembership, ClubMembershipRole } from '../models/ClubMembership.js';
import { Club } from '../models/Club.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword } from '../utils/password.js';
import { normalizeRole } from '../middleware/role.middleware.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

// Simple email regex RFC 5322 compatible
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      fullName,
      email,
      password,
      role,
      enrollmentNumber,
      prn,
      idNumber,
      employeeId,
      department,
      year,
      phone,
      mobile,
      clubId,
      clubName,
      avatar,
      bio,
      securityQuestions,
      status
    } = req.body;

    const resolvedName = (name || fullName || '').trim();
    const resolvedEmail = (email || '').trim().toLowerCase();
    const resolvedPassword = password || '';
    const resolvedIdNumber = (enrollmentNumber || prn || idNumber || employeeId || '').trim();
    const resolvedPhone = (phone || mobile || '').trim();

    // 1. Validate required fields
    if (!resolvedName) {
      res.status(400).json({ success: false, message: 'Name is required.' });
      return;
    }

    if (!resolvedEmail) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    if (!EMAIL_REGEX.test(resolvedEmail)) {
      res.status(400).json({ success: false, message: 'Invalid email address format.' });
      return;
    }

    if (!resolvedPassword) {
      res.status(400).json({ success: false, message: 'Password is required.' });
      return;
    }

    if (resolvedPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (!role) {
      res.status(400).json({ success: false, message: 'Role is required.' });
      return;
    }

    // 2. Validate and normalize role (strictly allow ONLY college_admin, president, student)
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
      res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Subhead and other roles are not allowed. Allowed roles are: College Admin, Club President, Student.`
      });
      return;
    }

    // 3. Check for duplicate email
    const existingUserByEmail = await User.findOne({ email: resolvedEmail });
    if (existingUserByEmail) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
      return;
    }

    // 4. Check for duplicate enrollmentNumber / ID Number if provided
    if (resolvedIdNumber) {
      const existingUserById = await User.findOne({ enrollmentNumber: resolvedIdNumber });
      if (existingUserById) {
        res.status(409).json({
          success: false,
          message: 'An account with this Student PRN / Employee ID already exists.'
        });
        return;
      }
    }

    // 5. Determine account status (default active, or pending if explicitly submitted as request)
    const initialStatus = status === 'pending' ? 'pending' : 'active';

    // 6. Create User
    const newUser = new User({
      name: resolvedName,
      email: resolvedEmail,
      password: resolvedPassword,
      role: normalizedRole,
      enrollmentNumber: resolvedIdNumber || undefined,
      department: department?.trim() || '',
      year: year?.trim() || '',
      phone: resolvedPhone || '',
      clubId: normalizedRole === 'president' ? clubId?.trim() : undefined,
      clubName: normalizedRole === 'president' ? clubName?.trim() : undefined,
      avatar: avatar || undefined,
      bio: bio?.trim() || '',
      securityQuestions: Array.isArray(securityQuestions) ? securityQuestions : undefined,
      status: initialStatus
    });

    await newUser.save();

    // 7. If active, generate JWT token
    const token = initialStatus === 'active'
      ? generateToken({
          id: newUser._id.toString(),
          role: newUser.role,
          email: newUser.email
        })
      : undefined;

    res.status(201).json({
      success: true,
      message: initialStatus === 'pending'
        ? 'Registration request submitted successfully. Pending College Admin approval.'
        : 'User registered successfully.',
      token,
      user: newUser.toJSON()
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      identifier,
      loginIdentifier: bodyLoginId,
      email,
      prn,
      enrollmentNumber,
      employeeId,
      password,
      role,
      club,
      clubId,
      clubName,
      securityAnswer
    } = req.body;

    const rawId = identifier ?? bodyLoginId ?? email ?? prn ?? enrollmentNumber ?? employeeId;
    const loginIdentifier = typeof rawId === 'string' ? rawId.trim() : '';

    // 1. Validate required fields
    if (!loginIdentifier) {
      res.status(400).json({
        success: false,
        message: 'Please provide your Email or Student PRN / Employee ID.'
      });
      return;
    }

    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
      return;
    }

    // 2. Find user by email (case-insensitive) OR enrollmentNumber/prn/employeeId (safely escaped exact-match)
    const escapedIdentifier = loginIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactIdentifierRegex = new RegExp(`^${escapedIdentifier}$`, 'i');

    let user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { enrollmentNumber: exactIdentifierRegex },
        { prn: exactIdentifierRegex },
        { employeeId: exactIdentifierRegex }
      ]
    }).select('+password +passwordHash');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
      return;
    }

    // 3. Verify password independently of role authorization
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
      return;
    }

    // 4. Account status check
    if (user.status === 'pending') {
      res.status(403).json({
        success: false,
        message: 'Your registration request is pending College Admin approval. You cannot access the portal until approved.'
      });
      return;
    }

    if (user.status === 'rejected') {
      res.status(403).json({
        success: false,
        message: 'Your registration request was rejected by the administrator.'
      });
      return;
    }

    // 5. Role & Club Membership Authorization
    let effectiveRole: AllowedRole = user.role || (user.userType ? normalizeRole(user.userType) : null) || UserRole.STUDENT;

    if (role) {
      const targetRole = normalizeRole(role);
      if (!targetRole) {
        res.status(401).json({
          success: false,
          message: `Invalid role '${role}'. Subhead and unsupported roles are not permitted.`
        });
        return;
      }

      if (targetRole === UserRole.COLLEGE_ADMIN) {
        if (user.role !== UserRole.COLLEGE_ADMIN && user.userType !== 'ADMIN') {
          res.status(401).json({
            success: false,
            message: 'Invalid credentials for the specified role.'
          });
          return;
        }
        effectiveRole = UserRole.COLLEGE_ADMIN;
      } else if (targetRole === UserRole.CLUB_PRESIDENT) {
        // Query active lead memberships in ClubMembership
        const leadMemberships = await ClubMembership.find({
          userId: user._id,
          role: { $in: [ClubMembershipRole.LEAD, 'lead', 'LEAD'] },
          isActive: true
        });

        const hasLeadRole = leadMemberships.length > 0 || user.role === UserRole.CLUB_PRESIDENT;
        if (!hasLeadRole) {
          res.status(401).json({
            success: false,
            message: 'Invalid credentials for the specified role. Account does not have active club lead permissions.'
          });
          return;
        }

        // Validate club if requested
        const rawClub = clubId ?? clubName ?? club;
        const requestedClub = typeof rawClub === 'string' ? rawClub.trim() : (rawClub && typeof rawClub === 'object' && 'name' in rawClub ? String(rawClub.name).trim() : '');
        if (requestedClub) {
          let isAuthorized = false;
          if (leadMemberships.length > 0) {
            const leadClubIds = leadMemberships.map((m) => m.clubId.toString());
            const leadClubs = await Club.find({ _id: { $in: leadClubIds } });

            const matchingClub = leadClubs.find(
              (c) =>
                c._id.toString() === requestedClub ||
                c.name.toLowerCase() === requestedClub.toLowerCase() ||
                c.shortName.toLowerCase() === requestedClub.toLowerCase()
            );

            if (matchingClub) {
              isAuthorized = true;
              user.clubId = matchingClub._id.toString();
              user.clubName = matchingClub.name;
            }
          }

          if (!isAuthorized) {
            const isUserDocMatch =
              user.clubId === requestedClub ||
              (user.clubName && user.clubName.toLowerCase() === requestedClub.toLowerCase());
            if (isUserDocMatch) {
              isAuthorized = true;
            }
          }

          if (!isAuthorized) {
            res.status(401).json({
              success: false,
              message: 'Account is not an authorized lead for the selected club.'
            });
            return;
          }
        } else if (leadMemberships.length > 0 && !user.clubId) {
          const firstLeadClub = await Club.findById(leadMemberships[0].clubId);
          if (firstLeadClub) {
            user.clubId = firstLeadClub._id.toString();
            user.clubName = firstLeadClub.name;
          }
        }
        effectiveRole = UserRole.CLUB_PRESIDENT;
      } else if (targetRole === UserRole.STUDENT) {
        if (user.role !== UserRole.STUDENT && user.userType !== 'STUDENT' && user.role !== UserRole.CLUB_PRESIDENT) {
          res.status(401).json({
            success: false,
            message: 'Invalid credentials for the specified role.'
          });
          return;
        }
        effectiveRole = UserRole.STUDENT;
      }
    }

    // 6. Two-Step Security Verification for Admin (server-side enforcement)
    if (effectiveRole === UserRole.COLLEGE_ADMIN) {
      if (user.securityQuestions && user.securityQuestions.length > 0) {
        const answerStr = typeof securityAnswer === 'string' ? securityAnswer.trim() : '';
        if (!answerStr) {
          res.status(401).json({
            success: false,
            message: 'Two-step security verification answer is required.'
          });
          return;
        }
        const match = user.securityQuestions.some(
          (sq: any) => typeof sq?.answer === 'string' && sq.answer.trim().toLowerCase() === answerStr.toLowerCase()
        );
        if (!match) {
          res.status(401).json({
            success: false,
            message: 'Incorrect two-step security answer.'
          });
          return;
        }
      }
    }

    // 7. Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      role: effectiveRole,
      email: user.email
    });

    const mustChangePassword = Boolean(user.mustChangePassword);

    res.status(200).json({
      success: true,
      message: mustChangePassword
        ? 'Temporary credential detected. You must change your password to continue.'
        : 'Login successful.',
      mustChangePassword,
      token,
      user: {
        ...user.toJSON(),
        role: effectiveRole,
        clubId: user.clubId,
        clubName: user.clubName
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated.'
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: req.user.toJSON()
  });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * POST /api/auth/change-password
 * Access: Authenticated (student, president, college_admin)
 * Allows user to change their password or update temporary credentials to a permanent password.
 */
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Current password is required.'
      });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({
        success: false,
        message: 'New password is required.'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
      return;
    }

    if (!(/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword))) {
      res.status(400).json({
        success: false,
        message: 'New password must contain both letters and numbers.'
      });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({
        success: false,
        message: 'New password must be different from your current password.'
      });
      return;
    }

    const user = await User.findById(req.user._id).select('+password +passwordHash');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
      return;
    }

    const isCurrentValid = await user.comparePassword(currentPassword);
    if (!isCurrentValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
      return;
    }

    user.password = await hashPassword(newPassword);
    user.passwordHash = user.password;
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetTokenUsed = false;
    await user.save();

    const freshToken = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Your permanent credentials are now active.',
      token: freshToken,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Access: Public
 * Logs a password reset request. Generates an expiring single-use token in the database.
 * Because external SMTP email is not configured in this campus deployment, user is directed
 * to obtain their single-use token through the Administrator-Managed Recovery channel.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, loginIdentifier: bodyLoginId, email, prn, employeeId } = req.body;
    const loginIdentifier = (identifier || bodyLoginId || email || prn || employeeId || '').trim();

    if (!loginIdentifier) {
      res.status(400).json({
        success: false,
        message: 'Please provide your Email, Student PRN, or Employee ID.'
      });
      return;
    }

    const escapedIdentifier = loginIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactIdentifierRegex = new RegExp(`^${escapedIdentifier}$`, 'i');

    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { enrollmentNumber: exactIdentifierRegex },
        { prn: exactIdentifierRegex },
        { employeeId: exactIdentifierRegex }
      ]
    });

    // Prevent account enumeration by always returning generic message
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account exists matching that identifier, a credential recovery request has been logged. Note: Institutional email delivery is not configured on this server; please contact your College Administrator to obtain your verified 15-minute reset token.',
        requiresAdminIssuance: true
      });
      return;
    }

    // Generate single-use, 15-minute expiring token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.resetTokenUsed = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'If an account exists matching that identifier, a credential recovery request has been logged. Note: Institutional email delivery is not configured on this server; please contact your College Administrator to obtain your verified 15-minute reset token.',
      requiresAdminIssuance: true
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Access: Public
 * Resets password using verified, single-use, expiring token. Invalidates all previous sessions.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      res.status(400).json({
        success: false,
        message: 'Reset token is required.'
      });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({
        success: false,
        message: 'New password is required.'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
      return;
    }

    if (!(/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword))) {
      res.status(400).json({
        success: false,
        message: 'New password must contain both letters and numbers.'
      });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken
    }).select('+password +passwordHash +resetPasswordToken +resetPasswordExpires +resetTokenUsed');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or unissued reset token.'
      });
      return;
    }

    if (user.resetTokenUsed) {
      res.status(400).json({
        success: false,
        message: 'This reset token has already been used. Please request a new token.'
      });
      return;
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Reset token has expired. Reset tokens are valid for 15 minutes.'
      });
      return;
    }

    user.password = await hashPassword(newPassword);
    user.passwordHash = user.password;
    user.mustChangePassword = false;
    user.resetTokenUsed = true;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. All previous sessions have been invalidated. Please log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/admin-issue-reset-token
 * Access: College Admin only
 * Administrator-managed credential recovery: Generates a 15-minute expiring single-use reset token
 * for a verified student or faculty member who requested recovery.
 */
export const adminIssueResetToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetIdentifier } = req.body;

    if (!targetIdentifier || typeof targetIdentifier !== 'string' || !targetIdentifier.trim()) {
      res.status(400).json({
        success: false,
        message: 'Target user identifier (Email, PRN, or Employee ID) is required.'
      });
      return;
    }

    const cleanId = targetIdentifier.trim();
    const escaped = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactRegex = new RegExp(`^${escaped}$`, 'i');

    const targetUser = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { enrollmentNumber: exactRegex },
        { prn: exactRegex },
        { employeeId: exactRegex }
      ]
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: 'Target user not found.'
      });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    targetUser.resetPasswordToken = hashedToken;
    targetUser.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    targetUser.resetTokenUsed = false;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'Single-use reset token generated successfully. Valid for 15 minutes.',
      resetToken: rawToken,
      expiresInMinutes: 15,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        enrollmentNumber: targetUser.enrollmentNumber
      }
    });
  } catch (error) {
    next(error);
  }
};
