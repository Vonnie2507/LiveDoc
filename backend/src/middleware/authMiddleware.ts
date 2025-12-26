import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';
import { findById } from '../models/UserModel';
import { UnauthorizedError } from '../utils/errorHandlers';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization token provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw new UnauthorizedError('Invalid authorization format');
    }

    const token = parts[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const userId = decoded.userId;

    let user;
    try {
      user = await findById(userId);
    } catch (error) {
      throw new Error('Authentication failed due to database error');
    }

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User account is inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      req.user = null;
      next();
      return;
    }

    const token = parts[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId;

      const user = await findById(userId);

      if (user && user.is_active) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (error) {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
}