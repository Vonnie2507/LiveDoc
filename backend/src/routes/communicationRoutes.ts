import { Router } from 'express';
import * as communicationController from '../controllers/communicationController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

router.get('/projects/:projectId/communications', authMiddleware, communicationController.listCommunications);

router.post('/projects/:projectId/communications', authMiddleware, communicationController.uploadCommunication);

router.get('/:id', authMiddleware, communicationController.getCommunication);

router.put('/:id/process', authMiddleware, communicationController.triggerProcessing);

export default router;