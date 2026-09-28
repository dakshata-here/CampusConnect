import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Club, ClubCategory, ClubStatus } from '../models/Club.js';
import { ClubMembership, ClubMembershipRole } from '../models/ClubMembership.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * GET /api/clubs
 * Access: Authenticated (student, president, college_admin)
 * Returns list of clubs.
 */
export const getClubs = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubs = await Club.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      clubs: clubs.map((c) => c.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:id
 * Access: Authenticated (student, president, college_admin)
 * Returns details of one club along with its active lead if available.
 */
export const getClubById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
      return;
    }

    const club = await Club.findById(id);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
      return;
    }

    // Retrieve active leadership info from ClubMembership if present
    const activeLead = await ClubMembership.findOne({
      clubId: club._id,
      role: ClubMembershipRole.LEAD,
      isActive: true
    }).populate('userId', 'name email avatar enrollmentNumber department phone');

    res.status(200).json({
      success: true,
      club: {
        ...club.toJSON(),
        lead: activeLead
          ? {
              id: activeLead.id,
              userId: (activeLead.userId as any)?._id || activeLead.userId,
              user: activeLead.userId,
              designation: activeLead.designation,
              joinedAt: activeLead.joinedAt
            }
          : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clubs
 * Access: College Admin only (requireAuth, requireRole('college_admin'))
 * Creates a new club.
 */
export const createClub = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      shortName,
      description,
      logoUrl,
      bannerUrl,
      departmentId,
      category,
      status,
      socialLinks
    } = req.body;

    // 1. Validate required fields
    const cleanName = (name || '').trim();
    if (!cleanName) {
      res.status(400).json({
        success: false,
        message: 'Club name is required.'
      });
      return;
    }

    const cleanShortName = (shortName || '').trim();
    if (!cleanShortName) {
      res.status(400).json({
        success: false,
        message: 'Club short name is required.'
      });
      return;
    }

    // 2. Validate category enum if provided
    let resolvedCategory = ClubCategory.OTHER;
    if (category !== undefined) {
      if (!Object.values(ClubCategory).includes(category)) {
        res.status(400).json({
          success: false,
          message: `Invalid club category '${category}'. Allowed categories: ${Object.values(ClubCategory).join(', ')}.`
        });
        return;
      }
      resolvedCategory = category as ClubCategory;
    }

    // 3. Validate status enum if provided
    let resolvedStatus = ClubStatus.ACTIVE;
    if (status !== undefined) {
      if (!Object.values(ClubStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid club status '${status}'. Allowed statuses: ${Object.values(ClubStatus).join(', ')}.`
        });
        return;
      }
      resolvedStatus = status as ClubStatus;
    }

    // 4. Validate departmentId if provided
    if (departmentId && !mongoose.Types.ObjectId.isValid(departmentId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid department ID format.'
      });
      return;
    }

    // 5. Check uniqueness of name
    const existingName = await Club.findOne({
      name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingName) {
      res.status(409).json({
        success: false,
        message: 'A club with this name already exists.'
      });
      return;
    }

    // 6. Check uniqueness of shortName
    const existingShortName = await Club.findOne({
      shortName: { $regex: new RegExp(`^${cleanShortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingShortName) {
      res.status(409).json({
        success: false,
        message: 'A club with this short name already exists.'
      });
      return;
    }

    // 7. Create and save club
    const newClub = new Club({
      name: cleanName,
      shortName: cleanShortName,
      description: description?.trim() || '',
      logoUrl: logoUrl?.trim() || '',
      bannerUrl: bannerUrl?.trim() || '',
      departmentId: departmentId || null,
      category: resolvedCategory,
      status: resolvedStatus,
      socialLinks: socialLinks && typeof socialLinks === 'object' ? socialLinks : {}
    });

    await newClub.save();

    res.status(201).json({
      success: true,
      message: 'Club created successfully.',
      club: newClub.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clubs/:id
 * Access: College Admin only (requireAuth, requireRole('college_admin'))
 * Updates club details.
 */
export const updateClub = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
      return;
    }

    const club = await Club.findById(id);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
      return;
    }

    const {
      name,
      shortName,
      description,
      logoUrl,
      bannerUrl,
      departmentId,
      category,
      status,
      socialLinks
    } = req.body;

    // Validate and update name
    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        res.status(400).json({
          success: false,
          message: 'Club name cannot be empty.'
        });
        return;
      }

      if (cleanName.toLowerCase() !== club.name.toLowerCase()) {
        const existingName = await Club.findOne({
          name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          _id: { $ne: club._id }
        });
        if (existingName) {
          res.status(409).json({
            success: false,
            message: 'A club with this name already exists.'
          });
          return;
        }
      }
      club.name = cleanName;
    }

    // Validate and update shortName
    if (shortName !== undefined) {
      const cleanShortName = String(shortName).trim();
      if (!cleanShortName) {
        res.status(400).json({
          success: false,
          message: 'Club short name cannot be empty.'
        });
        return;
      }

      if (cleanShortName.toLowerCase() !== club.shortName.toLowerCase()) {
        const existingShortName = await Club.findOne({
          shortName: { $regex: new RegExp(`^${cleanShortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          _id: { $ne: club._id }
        });
        if (existingShortName) {
          res.status(409).json({
            success: false,
            message: 'A club with this short name already exists.'
          });
          return;
        }
      }
      club.shortName = cleanShortName;
    }

    // Update description
    if (description !== undefined) {
      club.description = String(description).trim();
    }

    // Update logoUrl
    if (logoUrl !== undefined) {
      club.logoUrl = String(logoUrl).trim();
    }

    // Update bannerUrl
    if (bannerUrl !== undefined) {
      club.bannerUrl = String(bannerUrl).trim();
    }

    // Update departmentId
    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === '') {
        club.departmentId = null;
      } else if (mongoose.Types.ObjectId.isValid(departmentId)) {
        club.departmentId = new mongoose.Types.ObjectId(departmentId);
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid department ID format.'
        });
        return;
      }
    }

    // Validate and update category
    if (category !== undefined) {
      if (!Object.values(ClubCategory).includes(category)) {
        res.status(400).json({
          success: false,
          message: `Invalid club category '${category}'. Allowed categories: ${Object.values(ClubCategory).join(', ')}.`
        });
        return;
      }
      club.category = category as ClubCategory;
    }

    // Validate and update status
    if (status !== undefined) {
      if (!Object.values(ClubStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid club status '${status}'. Allowed statuses: ${Object.values(ClubStatus).join(', ')}.`
        });
        return;
      }
      club.status = status as ClubStatus;
    }

    // Update socialLinks
    if (socialLinks !== undefined && typeof socialLinks === 'object' && socialLinks !== null) {
      club.socialLinks = {
        website: socialLinks.website !== undefined ? String(socialLinks.website).trim() : club.socialLinks?.website || '',
        instagram: socialLinks.instagram !== undefined ? String(socialLinks.instagram).trim() : club.socialLinks?.instagram || '',
        linkedin: socialLinks.linkedin !== undefined ? String(socialLinks.linkedin).trim() : club.socialLinks?.linkedin || '',
        youtube: socialLinks.youtube !== undefined ? String(socialLinks.youtube).trim() : club.socialLinks?.youtube || '',
        other: socialLinks.other !== undefined ? String(socialLinks.other).trim() : club.socialLinks?.other || ''
      };
    }

    await club.save();

    res.status(200).json({
      success: true,
      message: 'Club updated successfully.',
      club: club.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/clubs/:id/status
 * Access: College Admin only (requireAuth, requireRole('college_admin'))
 * Activates or deactivates a club.
 */
export const updateClubStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid club ID format.'
      });
      return;
    }

    if (!status || !Object.values(ClubStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid club status. Status must be one of: ${Object.values(ClubStatus).join(', ')}.`
      });
      return;
    }

    const club = await Club.findById(id);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
      return;
    }

    club.status = status as ClubStatus;
    await club.save();

    res.status(200).json({
      success: true,
      message: `Club status updated to ${status}.`,
      club: club.toJSON()
    });
  } catch (error) {
    next(error);
  }
};
