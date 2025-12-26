import { Request, Response } from 'express';
import ProjectModel from '../models/ProjectModel';
import CommunicationModel from '../models/CommunicationModel';
import { ValidationError, UnauthorizedError, DatabaseError, NotFoundError } from '../utils/errorHandlers';
import claudeService from '../services/claudeService';

async function listCommunications(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;

    const hasAccess = await ProjectModel.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to view communications');
    }

    const communications = await CommunicationModel.findByProjectId(projectId, { orderBy: 'createdAt DESC' });

    res.status(200).json({ communications });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve communications');
  }
}

async function uploadCommunication(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const { type, subject, body, sender, recipient, receivedAt } = req.body;

    if (!type || !body || !sender) {
      throw new ValidationError('Type, body, and sender are required');
    }

    const hasAccess = await ProjectModel.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to upload communication');
    }

    const communication = await CommunicationModel.create({
      projectId,
      uploadedBy: userId,
      type,
      subject,
      body,
      sender,
      recipient,
      receivedAt,
      processingStatus: 'pending'
    });

    res.status(201).json({ communication });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to upload communication');
  }
}

async function getCommunication(req: Request, res: Response): Promise<void> {
  try {
    const communicationId = req.params.id;
    const userId = req.user.id;

    const communication = await CommunicationModel.findById(communicationId);
    if (!communication) {
      throw new NotFoundError('Communication not found');
    }

    const hasAccess = await ProjectModel.hasAccess(communication.projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to view communication');
    }

    res.status(200).json({ communication });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve communication');
  }
}

async function triggerProcessing(req: Request, res: Response): Promise<void> {
  try {
    const communicationId = req.params.id;
    const userId = req.user.id;

    const communication = await CommunicationModel.findById(communicationId);
    if (!communication) {
      throw new NotFoundError('Communication not found');
    }

    const hasAccess = await ProjectModel.hasAccess(communication.projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to process communication');
    }

    await CommunicationModel.updateProcessingStatus(communicationId, 'processing');

    claudeService.extractFieldsFromText(communication.body, communication.projectId);

    res.status(202).json({ message: 'Processing started', communicationId });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to update processing status');
  }
}

export { listCommunications, uploadCommunication, getCommunication, triggerProcessing };