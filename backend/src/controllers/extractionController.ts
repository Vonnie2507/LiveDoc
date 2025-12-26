import { Request, Response } from 'express';
import ProjectModel from '../models/ProjectModel';
import ExtractionModel from '../models/ExtractionModel';
import claudeService from '../services/claudeService';
import CommunicationModel from '../models/CommunicationModel';
import websocketService from '../services/websocketService';
import { 
  ValidationError, 
  UnauthorizedError, 
  InternalServerError, 
  DatabaseError, 
  NotFoundError 
} from '../utils/errorHandlers';

async function extractFromText(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user.id;
    const { text, projectId } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new ValidationError('Text is required for extraction');
    }

    const hasAccess = await ProjectModel.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to extract data for this project');
    }

    let extractionResult;
    try {
      extractionResult = await claudeService.extractFieldsFromText(text, projectId);
    } catch (error) {
      throw new InternalServerError('AI extraction service failed');
    }

    const createdExtractions = [];
    try {
      for (const field of extractionResult) {
        const extraction = await ExtractionModel.create({
          projectId,
          sourceType: 'manual',
          sourceId: null,
          fieldName: field.fieldName,
          extractedValue: field.extractedValue,
          confidenceScore: field.confidenceScore,
          status: 'pending'
        });
        createdExtractions.push(extraction);
      }
    } catch (error) {
      throw new DatabaseError('Failed to save extractions');
    }

    res.status(200).json({ extractions: createdExtractions });
  } catch (error) {
    throw error;
  }
}

async function getExtractions(req: Request, res: Response): Promise<void> {
  try {
    const communicationId = req.params.commId;
    const userId = req.user.id;

    let communication;
    try {
      communication = await CommunicationModel.findById(communicationId);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve extractions');
    }

    if (!communication) {
      throw new NotFoundError('Communication not found');
    }

    const hasAccess = await ProjectModel.hasAccess(communication.projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to view extractions');
    }

    let extractionArray;
    try {
      extractionArray = await ExtractionModel.findBySourceId(communicationId);
    } catch (error) {
      throw new DatabaseError('Failed to retrieve extractions');
    }

    res.status(200).json({ extractions: extractionArray });
  } catch (error) {
    throw error;
  }
}

async function confirmExtraction(req: Request, res: Response): Promise<void> {
  try {
    const extractionId = req.params.id;
    const userId = req.user.id;

    let extraction;
    try {
      extraction = await ExtractionModel.findById(extractionId);
    } catch (error) {
      throw new DatabaseError('Failed to confirm extraction');
    }

    if (!extraction) {
      throw new NotFoundError('Extraction not found');
    }

    const hasAccess = await ProjectModel.hasAccess(extraction.projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to confirm extraction');
    }

    const confirmedExtraction = await ExtractionModel.confirm(extractionId);

    res.status(200).json({ extraction: confirmedExtraction });
  } catch (error) {
    throw error;
  }
}

async function rejectExtraction(req: Request, res: Response): Promise<void> {
  try {
    const extractionId = req.params.id;
    const userId = req.user.id;

    let extraction;
    try {
      extraction = await ExtractionModel.findById(extractionId);
    } catch (error) {
      throw new DatabaseError('Failed to reject extraction');
    }

    if (!extraction) {
      throw new NotFoundError('Extraction not found');
    }

    const hasAccess = await ProjectModel.hasAccess(extraction.projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to reject extraction');
    }

    const rejectedExtraction = await ExtractionModel.reject(extractionId);

    res.status(200).json({ extraction: rejectedExtraction });
  } catch (error) {
    throw error;
  }
}

async function applyExtraction(req: Request, res: Response): Promise<void> {
  try {
    const extractionId = req.params.id;
    const userId = req.user.id;

    let extraction;
    try {
      extraction = await ExtractionModel.findById(extractionId);
    } catch (error) {
      throw new DatabaseError('Failed to apply extraction');
    }

    if (!extraction) {
      throw new NotFoundError('Extraction not found');
    }

    if (extraction.status !== 'confirmed') {
      throw new ValidationError('Only confirmed extractions can be applied');
    }

    const hasAccess = await ProjectModel.hasAccess(extraction.projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to apply extraction');
    }

    const appliedExtraction = await ExtractionModel.applyToProject(extractionId, userId);

    try {
      const updatedProject = await ProjectModel.findById(extraction.projectId);
      await websocketService.broadcastProjectUpdate(extraction.projectId, updatedProject);
    } catch (error) {
    }

    res.status(200).json({ 
      message: 'Extraction applied successfully', 
      extraction: appliedExtraction 
    });
  } catch (error) {
    throw error;
  }
}

async function batchApplyExtractions(req: Request, res: Response): Promise<void> {
  try {
    const { extractionIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(extractionIds) || extractionIds.length === 0) {
      throw new ValidationError('Extraction IDs array is required');
    }

    const extractions = [];
    let projectId = null;

    for (const extractionId of extractionIds) {
      const extraction = await ExtractionModel.findById(extractionId);
      if (!extraction) {
        throw new ValidationError('All extractions must be confirmed and belong to the same project');
      }
      if (extraction.status !== 'confirmed') {
        throw new ValidationError('All extractions must be confirmed and belong to the same project');
      }
      if (projectId === null) {
        projectId = extraction.projectId;
      } else if (projectId !== extraction.projectId) {
        throw new ValidationError('All extractions must be confirmed and belong to the same project');
      }
      extractions.push(extraction);
    }

    const hasAccess = await ProjectModel.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to apply extractions');
    }

    try {
      await ExtractionModel.batchApply(extractionIds, userId);
    } catch (error) {
      throw new DatabaseError('Failed to batch apply extractions');
    }

    try {
      const updatedProject = await ProjectModel.findById(projectId);
      await websocketService.broadcastProjectUpdate(projectId, updatedProject);
    } catch (error) {
    }

    res.status(200).json({ 
      message: 'Batch apply completed', 
      appliedCount: extractionIds.length 
    });
  } catch (error) {
    throw error;
  }
}

export {
  extractFromText,
  getExtractions,
  confirmExtraction,
  rejectExtraction,
  applyExtraction,
  batchApplyExtractions
};