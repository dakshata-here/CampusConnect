import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { User, IUser, UserRole } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
      return;
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.'
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: 'Invalid or malformed token.'
      });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
      return;
    }

    if (user.status === 'pending') {
      res.status(403).json({
        success: false,
        message: 'Your registration request is pending College Admin approval.'
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

    // 4. Invalidate sessions issued before password change
    if (decoded && (decoded as any).iat && user.passwordChangedAt) {
      const tokenIatSec = (decoded as any).iat;
      const pwdChangedSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (tokenIatSec < pwdChangedSec) {
        res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please log in again with your new credentials.'
        });
        return;
      }
    }

    // 5. Mandatory Password Change guard: block protected application features
    if (user.mustChangePassword) {
      const allowedPaths = [
        '/api/auth/me',
        '/api/auth/change-password',
        '/api/auth/logout',
        '/me',
        '/change-password',
        '/logout'
      ];
      const targetUrl = (req.originalUrl || req.url || '').split('?')[0];
      const isAllowed = allowedPaths.some((p) => targetUrl.endsWith(p));
      if (!isAllowed) {
        res.status(403).json({
          success: false,
          mustChangePassword: true,
          message: 'Password change required. You must change your temporary password before accessing application features.'
        });
        return;
      }
    }

    if (!user.role && user.userType) {
      if (user.userType === 'ADMIN') {
        user.role = UserRole.COLLEGE_ADMIN;
      } else if (user.userType === 'STUDENT') {
        user.role = UserRole.STUDENT;
      }
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
