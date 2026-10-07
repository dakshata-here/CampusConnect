import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { UserRole } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastNotice } from '../utils/notificationService.js';

/**
 * GET /api/notifications & GET /api/notifications/my
 * Access: Authenticated
 * Retrieves notifications for the logged-in user, including direct and role-targeted broadcasts.
 */
export const getMyNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const { unreadOnly } = req.query;

    const query: any = {
      $or: [
        { userId: user._id },
        {
          userId: null,
          $or: [{ targetRole: null }, { targetRole: user.role }]
        }
      ]
    };

    if (unreadOnly === 'true' || unreadOnly === '1') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('eventId', 'title date')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications: notifications.map((n) => n.toJSON())
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 * Access: Authenticated
 * Fast endpoint for polling unread badge count in Navbar.
 */
export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const query = {
      $or: [
        { userId: user._id },
        {
          userId: null,
          $or: [{ targetRole: null }, { targetRole: user.role }]
        }
      ],
      isRead: false
    };

    const count = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Access: Authenticated
 * Marks a specific notification as read.
 */
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.'
      });
      return;
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
      return;
    }

    // Verify ownership if user-specific
    if (notification.userId && notification.userId.toString() !== user._id.toString()) {
      if (user.role !== UserRole.COLLEGE_ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. You do not own this notification.'
        });
        return;
      }
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification: notification.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Access: Authenticated
 * Marks all notifications for the current user as read.
 */
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    await Notification.updateMany(
      {
        userId: user._id,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 * Access: Authenticated
 * Deletes a notification.
 */
export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.'
      });
      return;
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
      return;
    }

    if (notification.userId && notification.userId.toString() !== user._id.toString()) {
      if (user.role !== UserRole.COLLEGE_ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. You do not own this notification.'
        });
        return;
      }
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/broadcast
 * Access: College Admin only
 * Sends a campus-wide broadcast notification to all students or target roles.
 */
export const broadcastNoticeEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== UserRole.COLLEGE_ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only College Admins can broadcast notifications.'
      });
      return;
    }

    const { title, message, targetRole, eventId } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({
        success: false,
        message: 'Notice title is required.'
      });
      return;
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({
        success: false,
        message: 'Notice message is required.'
      });
      return;
    }

    const notice = await broadcastNotice(title, message, targetRole, eventId);

    res.status(201).json({
      success: true,
      message: 'Broadcast notice sent successfully.',
      notification: notice.toJSON()
    });
  } catch (error) {
    next(error);
  }
};
