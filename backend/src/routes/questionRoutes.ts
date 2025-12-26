import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { 
  getQuestionsByStage, 
  submitResponse, 
  getResponses, 
  getNextQuestions 
} from '../controllers/questionController';

const router = express.Router();

router.get('/:stage', authenticate, getQuestionsByStage);

router.post('/projects/:projectId/responses', authenticate, submitResponse);

router.get('/projects/:projectId/responses', authenticate, getResponses);

router.get('/:questionId/next', authenticate, getNextQuestions);

export default router;