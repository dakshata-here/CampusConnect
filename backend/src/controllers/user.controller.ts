import { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * GET /api/users/profile
 * Access: Authenticated (requireAuth)
 * Returns the sanitized profile of the current authenticated user.
 */
export const getProfile = async (
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

    res.status(200).json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 * Access: Authenticated (requireAuth)
 * Updates permitted profile fields for the authenticated user only.
 * Prohibits changing role, status, password, or modifying another user.
 */
export const updateProfile = async (
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

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.'
      });
      return;
    }

    const {
      name,
      department,
      year,
      avatar,
      phone,
      bio,
      followedClubs,
      securityQuestions,
      enrollmentNumber
    } = req.body;

    // Apply allowed profile updates only
    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        res.status(400).json({
          success: false,
          message: 'Name cannot be empty.'
        });
        return;
      }
      user.name = cleanName;
    }

    if (department !== undefined) {
      user.department = String(department).trim();
    }

    if (year !== undefined) {
      user.year = String(year).trim();
    }

    if (avatar !== undefined) {
      user.avatar = String(avatar).trim();
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (bio !== undefined) {
      user.bio = String(bio).trim();
    }

    if (Array.isArray(followedClubs)) {
      user.followedClubs = followedClubs.map((id) => String(id).trim()).filter(Boolean);
    }

    if (Array.isArray(securityQuestions)) {
      user.securityQuestions = securityQuestions.map((q) => ({
        question: String(q.question || '').trim(),
        answer: String(q.answer || '').trim()
      }));
    }

    if (enrollmentNumber !== undefined) {
      const cleanEnrollment = String(enrollmentNumber).trim();
      if (cleanEnrollment && cleanEnrollment !== user.enrollmentNumber) {
        const existing = await User.findOne({
          enrollmentNumber: cleanEnrollment,
          _id: { $ne: user._id }
        });
        if (existing) {
          res.status(409).json({
            success: false,
            message: 'Enrollment number / ID is already in use by another user.'
          });
          return;
        }
        user.enrollmentNumber = cleanEnrollment;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users
 * Access: College Admin only (requireAuth, requireRole('college_admin'))
 * Returns a list of all sanitized users without exposing passwords.
 */
export const getAllUsers = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => u.toJSON())
    });
  } catch (error) {
    next(error);
  }
};
