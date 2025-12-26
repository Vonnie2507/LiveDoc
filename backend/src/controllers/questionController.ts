import { Request, Response } from 'express';
import QuestionModel from '../models/QuestionModel';
import ProjectModel from '../models/ProjectModel';
import ResponseModel from '../models/ResponseModel';
import ChangeLogModel from '../models/ChangeLogModel';
import websocketService from '../services/websocketService';
import { ValidationError, UnauthorizedError, NotFoundError, DatabaseError } from '../utils/errorHandlers';

async function getQuestionsByStage(req: Request, res: Response): Promise<void> {
  try {
    const { stage } = req.params;
    
    const allowedStages = [
      'General Information',
      'Building',
      'Electrical',
      'Solar System Details',
      'Structural',
      'Attachments',
      'Internal Notes'
    ];
    
    if (!allowedStages.includes(stage)) {
      throw new ValidationError('Invalid stage value');
    }
    
    const questions = await QuestionModel.findByStage(stage);
    
    res.status(200).json({ questions });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve questions');
  }
}

async function submitResponse(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { questionId, answerValue } = req.body;
    
    if (!questionId || answerValue === undefined) {
      throw new ValidationError('Question ID and answer value are required');
    }
    
    const hasAccess = await ProjectModel.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to submit response');
    }
    
    const question = await QuestionModel.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }
    
    const response = await ResponseModel.create({
      projectId,
      questionId,
      answeredBy: userId,
      answerValue
    });
    
    await ChangeLogModel.create({
      projectId,
      userId,
      changeType: 'standard',
      fieldName: question.label,
      newValue: answerValue
    });
    
    try {
      await websocketService.broadcastProjectUpdate(projectId, { responseAdded: true });
    } catch (wsError) {
      // Log but do not fail request
    }
    
    res.status(201).json({ response });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof UnauthorizedError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to submit response');
  }
}

async function getResponses(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    const hasAccess = await ProjectModel.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to view responses');
    }
    
    const responses = await ResponseModel.findByProjectId(projectId);
    
    res.status(200).json({ responses });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve responses');
  }
}

async function getNextQuestions(req: Request, res: Response): Promise<void> {
  try {
    const { questionId } = req.params;
    const { projectId } = req.query;
    
    if (!projectId || typeof projectId !== 'string') {
      throw new ValidationError('Project ID is required');
    }
    
    const question = await QuestionModel.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }
    
    const responses = await ResponseModel.findByProjectId(projectId);
    
    const nextQuestions = await QuestionModel.findNextQuestions(questionId, responses);
    
    res.status(200).json({ nextQuestions });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve next questions');
  }
}

export { getQuestionsByStage, submitResponse, getResponses, getNextQuestions };