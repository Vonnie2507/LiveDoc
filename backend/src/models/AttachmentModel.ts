import { pool } from '../config/database';
import { Attachment } from '../types/models';
import { DatabaseError, ValidationError } from '../utils/errorHandlers';

export async function create(data: { projectId: number; fileName: string; fileType: string; fileUrl: string; fileSize: number; uploadedBy: number }): Promise<Attachment> {
  try {
    if (data.fileSize <= 0) {
      throw new ValidationError('File size must be positive integer');
    }

    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [data.projectId]
    );

    if (projectCheck.rows.length === 0) {
      throw new DatabaseError('Invalid projectId or uploadedBy reference');
    }

    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [data.uploadedBy]
    );

    if (userCheck.rows.length === 0) {
      throw new DatabaseError('Invalid projectId or uploadedBy reference');
    }

    const result = await pool.query(
      'INSERT INTO attachments (project_id, file_name, file_type, file_url, file_size, uploaded_by, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [data.projectId, data.fileName, data.fileType, data.fileUrl, data.fileSize, data.uploadedBy]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      projectId: row.project_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at
    };
  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    if (error.code === '23503') {
      throw new DatabaseError('Invalid projectId or uploadedBy reference');
    }
    throw new DatabaseError(`Failed to create attachment: ${error.message}`);
  }
}

export async function findByProjectId(projectId: number): Promise<Attachment[]> {
  try {
    const result = await pool.query(
      'SELECT a.id, a.project_id, a.file_name, a.file_type, a.file_url, a.file_size, a.uploaded_by, a.uploaded_at, u.full_name as uploader_name FROM attachments a JOIN users u ON a.uploaded_by = u.id WHERE a.project_id = $1 ORDER BY a.uploaded_at DESC',
      [projectId]
    );

    return result.rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at,
      uploaderName: row.uploader_name
    }));
  } catch (error: any) {
    throw new DatabaseError(`Failed to retrieve attachments for project ${projectId}: ${error.message}`);
  }
}

export async function findById(id: number): Promise<Attachment | null> {
  try {
    const result = await pool.query(
      'SELECT a.id, a.project_id, a.file_name, a.file_type, a.file_url, a.file_size, a.uploaded_by, a.uploaded_at, u.full_name as uploader_name FROM attachments a JOIN users u ON a.uploaded_by = u.id WHERE a.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      projectId: row.project_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at,
      uploaderName: row.uploader_name
    };
  } catch (error: any) {
    throw new DatabaseError(`Failed to retrieve attachment ${id}: ${error.message}`);
  }
}

export async function delete(id: number, deletedBy: number): Promise<void> {
  try {
    const checkResult = await pool.query(
      'SELECT id FROM attachments WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new ValidationError(`Attachment ${id} not found`);
    }

    await pool.query(
      'UPDATE attachments SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
      [deletedBy, id]
    );
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError(`Failed to delete attachment ${id}: ${error.message}`);
  }
}