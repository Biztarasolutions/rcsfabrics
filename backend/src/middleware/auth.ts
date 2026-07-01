import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { AuthRequest, JWTPayload } from '@/types';

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required',
      statusCode: 401,
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      statusCode: 401,
    });
  }
};

export const authorizeRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        statusCode: 401,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
        statusCode: 403,
      });
      return;
    }

    next();
  };
};
