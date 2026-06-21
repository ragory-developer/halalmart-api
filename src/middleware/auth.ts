import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches user info to req.user.
 */
export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as { userId: string; role: string };
    
    // Check if user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return next(new UnauthorizedError('User not found'));
    }

    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    return next(error);
  }
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't block if missing.
 */
export const optionalAuthenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token - proceed as guest
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as { userId: string; role: string };
    
    // Check if user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return next(new UnauthorizedError('User not found'));
    }

    req.user = { userId: user.id, role: user.role };
  } catch (error) {
    // If it's a "User not found" error, we block and return 401 to force frontend to clear token.
    // Otherwise (e.g. invalid/expired jwt format), we just proceed as guest.
    if (error instanceof UnauthorizedError && error.message === 'User not found') {
      return next(error);
    }
  }
  next();
};

/**
 * Role-based authorization middleware.
 * Must be used after `authenticate`.
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};
