import { Request, Response } from 'express';
import ProjectModel from '../models/ProjectModel';
import ChangeLogModel from '../models/ChangeLogModel';
import StatusHistoryModel from '../models/StatusHistoryModel';
import { DatabaseError, InternalServerError, NotFoundError, UnauthorizedError, ValidationError, ConflictError } from '../utils/errorHandlers';
import { validateRequired } from '../utils/validators';
import websocketService from '../services/websocketService';

async function listProjects(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const status = req.query.status as string | undefined;
    const assignedOnly = req.query.assignedOnly === 'true';

    const projects = await ProjectModel.findAll(userId, { status, assignedOnly });

    res.status(200).json({ projects });
  } catch (error: any) {
    if (error.name === 'DatabaseError') {
      throw new DatabaseError('Failed to retrieve projects');
    }
    throw new InternalServerError('Unexpected error listing projects');
  }
}

async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.id;

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const hasAccess = await ProjectModel.hasAccess(projectId, userId);

    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to view project');
    }

    res.status(200).json({ project });
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve project');
  }
}

async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { name, description, customerName, customerEmail, customerPhone } = req.body;

    if (!validateRequired(name) || !validateRequired(customerName)) {
      throw new ValidationError('Name and customer name are required');
    }

    const projectData = {
      name,
      description,
      customerName,
      customerEmail,
      customerPhone,
      createdBy: userId,
      status: 'draft'
    };

    const newProject = await ProjectModel.create(projectData);

    try {
      await ChangeLogModel.create({
        projectId: newProject.id,
        userId,
        changeType: 'standard',
        fieldName: 'Project Created',
        newValue: 'Initial draft'
      });
    } catch (logError) {
      // Log error but do not fail request
    }

    res.status(201).json({ project: newProject });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to create project');
  }
}

async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.id;

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.lockedBy && project.lockedBy !== userId) {
      throw new ConflictError('Project is locked by another user');
    }

    for (const [fieldName, newValue] of Object.entries(req.body)) {
      const oldValue = (project as any)[fieldName];
      if (oldValue !== newValue) {
        await ChangeLogModel.create({
          projectId,
          userId,
          changeType: 'standard',
          fieldName,
          oldValue: String(oldValue),
          newValue: String(newValue)
        });
      }
    }

    const updatedProject = await ProjectModel.update(projectId, req.body);

    try {
      websocketService.broadcastProjectUpdate(projectId, updatedProject);
    } catch (wsError) {
      // Log error but do not fail request
    }

    res.status(200).json({ project: updatedProject });
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    throw new DatabaseError('Failed to update project');
  }
}

async function softDeleteProject(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (userRole !== 'admin' && project.createdBy !== userId) {
      throw new UnauthorizedError('Only project owner or admin can delete projects');
    }

    await ProjectModel.softDelete(projectId);

    await ChangeLogModel.create({
      projectId,
      userId,
      changeType: 'standard',
      fieldName: 'Project Deleted',
      newValue: 'Soft deleted'
    });

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete project');
  }
}

async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.id;

    const hasAccess = await ProjectModel.hasAccess(projectId, userId);

    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to view project history');
    }

    const history = await ChangeLogModel.findByProjectId(projectId, { orderBy: 'createdAt DESC' });

    res.status(200).json({ history });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve project history');
  }
}

async function updateStatus(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.id;
    const newStatus = req.body.status;

    const validStatuses = ['draft', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new ValidationError('Invalid status value');
    }

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const updatedProject = await ProjectModel.update(projectId, { status: newStatus });

    await StatusHistoryModel.create({
      projectId,
      oldStatus: project.status,
      newStatus,
      changedBy: userId
    });

    await ChangeLogModel.create({
      projectId,
      userId,
      changeType: 'statusChange',
      fieldName: 'Status',
      oldValue: project.status,
      newValue: newStatus
    });

    res.status(200).json({ project: updatedProject });
  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update project status');
  }
}

async function assignTeam(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { salesUserId, schedulerUserId, productionUserId, installerUserId } = req.body;

    if (userRole !== 'admin' && userRole !== 'sales') {
      throw new UnauthorizedError('Only admin or sales can assign team members');
    }

    const updatedProject = await ProjectModel.update(projectId, {
      salesUserId,
      schedulerUserId,
      productionUserId,
      installerUserId
    });

    await ChangeLogModel.create({
      projectId,
      userId,
      changeType: 'standard',
      fieldName: 'Team Assignment',
      newValue: JSON.stringify(req.body)
    });

    res.status(200).json({ project: updatedProject });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to assign team members');
  }
}

async function acquireLock(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.id;

    const lockAcquired = await ProjectModel.lockForEdit(projectId, userId);

    if (!lockAcquired) {
      throw new ConflictError('Project is currently locked by another user');
    }

    res.status(200).json({ locked: true, lockedBy: userId, lockedAt: new Date() });
  } catch (error: any) {
    if (error instanceof ConflictError) {
      throw error;
    }
    throw new DatabaseError('Failed to acquire project lock');
  }
}

async function releaseLock(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.id;

    const lockReleased = await ProjectModel.releaseLock(projectId, userId);

    if (!lockReleased) {
      throw new UnauthorizedError('Cannot release lock held by another user');
    }

    res.status(200).json({ locked: false });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to release project lock');
  }
}

export { listProjects, getProject, createProject, updateProject, softDeleteProject, getHistory, updateStatus, assignTeam, acquireLock, releaseLock };