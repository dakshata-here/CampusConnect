import { Request, Response, NextFunction } from 'express';
import { User, AllowedRole, ALLOWED_ROLES } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
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
    const { identifier, email, prn, enrollmentNumber, employeeId, password, role, securityAnswer } = req.body;

    const loginIdentifier = (identifier || email || prn || enrollmentNumber || employeeId || '').trim();

    // 1. Validate required fields
    if (!loginIdentifier) {
      res.status(400).json({
        success: false,
        message: 'Please provide your Email or Student PRN / Employee ID.'
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
      return;
    }

    // 2. Find user by email (case-insensitive) OR enrollmentNumber (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { enrollmentNumber: { $regex: new RegExp(`^${loginIdentifier}$`, 'i') } }
      ]
    }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
      return;
    }

    // 3. Optional role check if requested by client
    if (role) {
      const targetRole = normalizeRole(role);
      if (targetRole && user.role !== targetRole) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials for the specified role.'
        });
        return;
      }
    }

    // 4. Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
      return;
    }

    // 5. Account status check
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

    // 6. Optional 2-Step Security Verification for Admin if securityQuestions are set and answer provided
    if (user.role === 'college_admin' && user.securityQuestions && user.securityQuestions.length > 0 && securityAnswer) {
      const match = user.securityQuestions.some(
        (sq) => sq.answer.trim().toLowerCase() === securityAnswer.trim().toLowerCase()
      );
      if (!match) {
        res.status(401).json({
          success: false,
          message: 'Incorrect two-step security answer.'
        });
        return;
      }
    }

    // 7. Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: user.toJSON()
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
