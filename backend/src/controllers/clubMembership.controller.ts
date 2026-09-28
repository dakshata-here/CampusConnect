import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Club } from '../models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../models/ClubMembership.js';
import { User, UserRole } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * Helper to check if authenticated user is College Admin OR active LEAD of target club.
 */
export const isAuthorizedLeadOrAdmin = async (
  req: AuthenticatedRequest,
  clubId: string | mongoose.Types.ObjectId
): Promise<boolean> => {
  if (!req.user) {
    return false;
  }

  // 1. College Admin has full management privileges across all clubs
  if (req.user.role === UserRole.COLLEGE_ADMIN) {
    return true;
  }

  // 2. Otherwise, check if user has an active LEAD membership in the target club
  const activeLeadMembership = await ClubMembership.findOne({
    clubId,
    userId: req.user._id,
    role: ClubMembershipRole.LEAD,
    isActive: true
  });

  return !!activeLeadMembership;
};

/**
 * GET /api/clubs/:clubId/members
 * Access: Authenticated (student, president, college_admin)
 * Returns all members of a specific club.
 */
export const getClubMembers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clubId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
      return;
    }

    const club = await Club.findById(clubId);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
      return;
    }

    const memberships = await ClubMembership.find({ clubId: club._id })
      .populate('userId', 'name email department year enrollmentNumber avatar phone bio')
      .sort({ role: 1, joinedAt: -1 });

    res.status(200).json({
      success: true,
      count: memberships.length,
      members: memberships.map((m) => ({
        id: m.id,
        clubId: m.clubId,
        userId: (m.userId as any)?._id || m.userId,
        user: m.userId,
        role: m.role,
        designation: m.designation,
        joinedAt: m.joinedAt,
        isActive: m.isActive
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:clubId/lead
 * Access: Authenticated (student, president, college_admin)
 * Returns the active LEAD of a club.
 */
export const getClubLead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clubId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
      return;
    }

    const club = await Club.findById(clubId);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
      return;
    }

    const lead = await ClubMembership.findOne({
      clubId: club._id,
      role: ClubMembershipRole.LEAD,
      isActive: true
    }).populate('userId', 'name email department year enrollmentNumber avatar phone bio');

    if (!lead) {
      res.status(404).json({
        success: false,
        message: 'No active lead found for this club.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      lead: {
        id: lead.id,
        clubId: lead.clubId,
        userId: (lead.userId as any)?._id || lead.userId,
        user: lead.userId,
        role: lead.role,
        designation: lead.designation,
        joinedAt: lead.joinedAt,
        isActive: lead.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clubs/:clubId/members
 * Access: College Admin OR active LEAD of this club
 * Adds a member or assigns a new lead to the club.
 */
export const addClubMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clubId } = req.params;
    const { userId, role, designation, isActive } = req.body;

    // 1. Validate club ID
    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
      return;
    }

    const club = await Club.findById(clubId);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
      return;
    }

    // 2. Authorization check
    const isAuthorized = await isAuthorizedLeadOrAdmin(req, club._id);
    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized. Only College Admins or the active Lead of this club can add members.'
      });
      return;
    }

    // 3. Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required.'
      });
      return;
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: 'User not found.'
      });
      return;
    }

    // 4. Validate role if provided
    let resolvedRole = ClubMembershipRole.MEMBER;
    if (role !== undefined) {
      if (!Object.values(ClubMembershipRole).includes(role)) {
        res.status(400).json({
          success: false,
          message: `Invalid membership role '${role}'. Allowed roles: ${Object.values(ClubMembershipRole).join(', ')}.`
        });
        return;
      }
      resolvedRole = role as ClubMembershipRole;
    }

    // 5. Check if membership already exists for this club + user
    const existingMembership = await ClubMembership.findOne({
      clubId: club._id,
      userId: targetUser._id
    });
    if (existingMembership) {
      res.status(409).json({
        success: false,
        message: 'User is already a member of this club.'
      });
      return;
    }

    // 6. If adding as active LEAD, demote any previous active LEAD in this club to preserve single active lead invariant
    if (resolvedRole === ClubMembershipRole.LEAD && (isActive === undefined || isActive === true)) {
      await ClubMembership.updateMany(
        {
          clubId: club._id,
          role: ClubMembershipRole.LEAD,
          isActive: true
        },
        {
          $set: { role: ClubMembershipRole.MEMBER }
        }
      );
    }

    // 7. Create new membership
    const membership = new ClubMembership({
      clubId: club._id,
      userId: targetUser._id,
      role: resolvedRole,
      designation: designation?.trim() || '',
      joinedAt: new Date(),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    await membership.save();
    await membership.populate('userId', 'name email department year enrollmentNumber avatar phone bio');

    res.status(201).json({
      success: true,
      message: resolvedRole === ClubMembershipRole.LEAD ? 'Club lead assigned successfully.' : 'Club member added successfully.',
      membership: {
        id: membership.id,
        clubId: membership.clubId,
        userId: (membership.userId as any)?._id || membership.userId,
        user: membership.userId,
        role: membership.role,
        designation: membership.designation,
        joinedAt: membership.joinedAt,
        isActive: membership.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/clubs/:clubId/members/:userId
 * Access: College Admin OR active LEAD of this club
 * Updates membership role, designation, or active status.
 */
export const updateClubMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clubId, userId } = req.params;
    const { role, designation, isActive } = req.body;

    // 1. Validate IDs
    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
      return;
    }

    const club = await Club.findById(clubId);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
      return;
    }

    // 2. Authorization check
    const isAuthorized = await isAuthorizedLeadOrAdmin(req, club._id);
    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized. Only College Admins or the active Lead of this club can update memberships.'
      });
      return;
    }

    // 3. Find target membership
    const membership = await ClubMembership.findOne({
      clubId: club._id,
      userId: new mongoose.Types.ObjectId(userId)
    });
    if (!membership) {
      res.status(404).json({
        success: false,
        message: 'Membership not found for this user in the specified club.'
      });
      return;
    }

    // 4. Validate and apply role update
    if (role !== undefined) {
      if (!Object.values(ClubMembershipRole).includes(role)) {
        res.status(400).json({
          success: false,
          message: `Invalid membership role '${role}'. Allowed roles: ${Object.values(ClubMembershipRole).join(', ')}.`
        });
        return;
      }

      // If promoting this member to active LEAD, demote previous active LEAD in this club
      if (role === ClubMembershipRole.LEAD && (isActive === undefined || isActive === true)) {
        await ClubMembership.updateMany(
          {
            clubId: club._id,
            userId: { $ne: membership.userId },
            role: ClubMembershipRole.LEAD,
            isActive: true
          },
          {
            $set: { role: ClubMembershipRole.MEMBER }
          }
        );
        membership.isActive = true;
      }
      membership.role = role as ClubMembershipRole;
    }

    // 5. Apply designation update
    if (designation !== undefined) {
      membership.designation = String(designation).trim();
    }

    // 6. Apply isActive update
    if (isActive !== undefined) {
      membership.isActive = Boolean(isActive);
    }

    await membership.save();
    await membership.populate('userId', 'name email department year enrollmentNumber avatar phone bio');

    res.status(200).json({
      success: true,
      message: 'Club membership updated successfully.',
      membership: {
        id: membership.id,
        clubId: membership.clubId,
        userId: (membership.userId as any)?._id || membership.userId,
        user: membership.userId,
        role: membership.role,
        designation: membership.designation,
        joinedAt: membership.joinedAt,
        isActive: membership.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/clubs/:clubId/members/:userId
 * Access: College Admin OR active LEAD of this club
 * Deactivates membership for the specified user in the club.
 */
export const removeClubMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clubId, userId } = req.params;

    // 1. Validate IDs
    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
      return;
    }

    const club = await Club.findById(clubId);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
      return;
    }

    // 2. Authorization check
    const isAuthorized = await isAuthorizedLeadOrAdmin(req, club._id);
    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized. Only College Admins or the active Lead of this club can deactivate members.'
      });
      return;
    }

    // 3. Find membership
    const membership = await ClubMembership.findOne({
      clubId: club._id,
      userId: new mongoose.Types.ObjectId(userId)
    });
    if (!membership) {
      res.status(404).json({
        success: false,
        message: 'Membership not found for this user in the specified club.'
      });
      return;
    }

    // 4. Deactivate membership (safe deactivation preserving membership history)
    membership.isActive = false;
    await membership.save();

    res.status(200).json({
      success: true,
      message: 'Club member deactivated successfully.',
      membership: {
        id: membership.id,
        clubId: membership.clubId,
        userId: membership.userId,
        role: membership.role,
        designation: membership.designation,
        joinedAt: membership.joinedAt,
        isActive: membership.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};
