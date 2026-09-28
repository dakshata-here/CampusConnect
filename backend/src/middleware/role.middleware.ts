import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { AllowedRole, ALLOWED_ROLES, UserRole } from '../models/User.js';

export const normalizeRole = (role: string): AllowedRole | null => {
  const clean = role.trim().toLowerCase();

  if (clean === 'college_admin' || clean === 'admin' || clean === 'college admin') {
    return UserRole.COLLEGE_ADMIN;
  }
  if (clean === 'president' || clean === 'club_president' || clean === 'lead' || clean === 'club president') {
    return UserRole.CLUB_PRESIDENT;
  }
  if (clean === 'student') {
    return UserRole.STUDENT;
  }

  return null;
};

export const requireRole = (...roles: (AllowedRole | string)[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required before role verification.'
      });
      return;
    }

    const normalizedTargetRoles = roles
      .map((r) => normalizeRole(r))
      .filter((r): r is AllowedRole => r !== null);

    const userRole = req.user.role;

    if (!normalizedTargetRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: [${normalizedTargetRoles.join(', ')}]. Current role: ${userRole}`
      });
      return;
    }

    next();
  };
};
