import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, projectController.listProjects);

router.get('/:id', authMiddleware, projectController.getProject);

router.post('/', authMiddleware, roleMiddleware(['sales', 'admin']), projectController.createProject);

router.put('/:id', authMiddleware, projectController.updateProject);

router.delete('/:id', authMiddleware, roleMiddleware(['sales', 'admin']), projectController.softDeleteProject);

router.get('/:id/history', authMiddleware, projectController.getHistory);

router.put('/:id/status', authMiddleware, projectController.updateStatus);

router.put('/:id/assign', authMiddleware, roleMiddleware(['sales', 'admin']), projectController.assignTeam);

router.post('/:id/lock', authMiddleware, projectController.acquireLock);

router.delete('/:id/lock', authMiddleware, projectController.releaseLock);

export default router;