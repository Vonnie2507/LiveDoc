import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errorHandlers';
import { findById } from '../models/ProjectModel';

export function requireRole(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const userRole = req.user.role_name;

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError('Insufficient permissions for this action');
    }

    next();
  };
}

export async function requireProjectAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const projectId = req.params.projectId || req.params.id;

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  try {
    const project = await findById(projectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const userRole = req.user.role_name;

    if (userRole === 'admin') {
      next();
      return;
    }

    const isAssigned = project.assigned_users.includes(req.user.id);

    if (!isAssigned) {
      throw new ForbiddenError('Access denied to this project');
    }

    next();
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new Error('Access check failed due to database error');
  }
}