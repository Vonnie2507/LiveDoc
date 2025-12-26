import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  listAttachments,
  uploadAttachment,
  getAttachment,
  downloadAttachment,
  deleteAttachment
} from '../controllers/attachmentController';

const router = express.Router();

router.get('/projects/:projectId/attachments', authenticate, listAttachments);

router.post('/projects/:projectId/attachments', authenticate, uploadAttachment);

router.get('/:id', authenticate, getAttachment);

router.get('/:id/download', authenticate, downloadAttachment);

router.delete('/:id', authenticate, deleteAttachment);

export default router;