import { Request, Response } from 'express';
import ProjectModel from '../models/ProjectModel';
import AttachmentModel from '../models/AttachmentModel';
import ChangeLogModel from '../models/ChangeLogModel';
import fileStorageService from '../services/fileStorageService';
import { ValidationError, UnauthorizedError, InternalServerError, NotFoundError, DatabaseError } from '../utils/errorHandlers';

async function listAttachments(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;

    const hasAccess = await ProjectModel.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to view attachments');
    }

    const attachments = await AttachmentModel.findByProjectId(projectId, { orderBy: 'uploadedAt DESC' });

    res.status(200).json({ attachments });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve attachments');
  }
}

async function uploadAttachment(req: Request, res: Response): Promise<void> {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;

    if (!req.file) {
      throw new ValidationError('File is required');
    }

    const hasAccess = await ProjectModel.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to upload attachments');
    }

    let fileUrl: string;
    let fileKey: string;
    try {
      const uploadResult = await fileStorageService.uploadFile(req.file, projectId);
      fileUrl = uploadResult.fileUrl;
      fileKey = uploadResult.fileKey;
    } catch (error) {
      throw new InternalServerError('File upload failed');
    }

    const attachment = await AttachmentModel.create({
      projectId,
      uploadedBy: userId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl,
      fileKey
    });

    await ChangeLogModel.create({
      projectId,
      userId,
      changeType: 'standard',
      fieldName: 'Attachment Added',
      newValue: req.file.originalname
    });

    res.status(201).json({ attachment });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof UnauthorizedError || error instanceof InternalServerError) {
      throw error;
    }
    throw new DatabaseError('Failed to save attachment record');
  }
}

async function getAttachment(req: Request, res: Response): Promise<void> {
  try {
    const attachmentId = req.params.id;
    const userId = req.user.id;

    const attachment = await AttachmentModel.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    const hasAccess = await ProjectModel.hasAccess(attachment.projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to view attachment');
    }

    res.status(200).json({ attachment });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve attachment');
  }
}

async function downloadAttachment(req: Request, res: Response): Promise<void> {
  try {
    const attachmentId = req.params.id;
    const userId = req.user.id;

    const attachment = await AttachmentModel.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    const hasAccess = await ProjectModel.hasAccess(attachment.projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to download attachment');
    }

    let signedUrl: string;
    try {
      signedUrl = await fileStorageService.generateSignedUrl(attachment.fileKey);
    } catch (error) {
      throw new InternalServerError('Failed to generate download URL');
    }

    res.status(200).json({ downloadUrl: signedUrl });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError || error instanceof InternalServerError) {
      throw error;
    }
    throw new DatabaseError('Failed to retrieve attachment');
  }
}

async function deleteAttachment(req: Request, res: Response): Promise<void> {
  try {
    const attachmentId = req.params.id;
    const userId = req.user.id;

    const attachment = await AttachmentModel.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    const hasAccess = await ProjectModel.hasAccess(attachment.projectId, userId);
    if (!hasAccess) {
      throw new UnauthorizedError('Insufficient permissions to delete attachment');
    }

    if (req.user.role !== 'admin' && attachment.uploadedBy !== userId) {
      throw new UnauthorizedError('Only admin or uploader can delete attachments');
    }

    try {
      await fileStorageService.deleteFile(attachment.fileKey);
    } catch (error) {
      throw new InternalServerError('Failed to delete file from storage');
    }

    await AttachmentModel.delete(attachmentId);

    await ChangeLogModel.create({
      projectId: attachment.projectId,
      userId,
      changeType: 'standard',
      fieldName: 'Attachment Deleted',
      newValue: attachment.fileName
    });

    res.status(200).json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError || error instanceof InternalServerError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete attachment record');
  }
}

export { listAttachments, uploadAttachment, getAttachment, downloadAttachment, deleteAttachment };