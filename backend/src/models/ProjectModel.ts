import { pool } from '../config/database';
import { Project } from '../types/models';
import { NotFoundError, ConflictError, ValidationError, DatabaseError } from '../utils/errorHandlers';
import { logger } from '../utils/logger';
import { validateEmail } from '../utils/validators';

async function findAll(filters?: { status?: string, userId?: number }): Promise<Project[]> {
  try {
    let query = 'SELECT id, name, status, client_name, client_email, client_phone, created_at, updated_at, created_by_id, deleted_at FROM projects WHERE deleted_at IS NULL';
    const values: any[] = [];
    let paramCounter = 1;

    if (filters?.status) {
      query += ` AND status = $${paramCounter}`;
      values.push(filters.status);
      paramCounter++;
    }

    if (filters?.userId) {
      query += ` AND created_by_id = $${paramCounter}`;
      values.push(filters.userId);
      paramCounter++;
    }

    const result = await pool.query(query, values);
    return result.rows as Project[];
  } catch (error: any) {
    logger.error('Failed to retrieve projects: ' + error.message);
    throw new DatabaseError('Failed to retrieve projects: ' + error.message);
  }
}

async function findById(id: number): Promise<Project | null> {
  try {
    const query = 'SELECT id, name, status, client_name, client_email, client_phone, locked_by_user_id, locked_at, created_at, updated_at, created_by_id, deleted_at FROM projects WHERE id = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as Project;
  } catch (error: any) {
    logger.error('Failed to find project by id ' + id + ': ' + error.message);
    throw new DatabaseError('Failed to find project by id ' + id + ': ' + error.message);
  }
}

async function create(data: { name: string, client_name: string, client_email: string, client_phone?: string, created_by_id: number }): Promise<Project> {
  try {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Invalid project data: name cannot be empty');
    }

    if (!validateEmail(data.client_email)) {
      throw new ValidationError('Invalid project data: client_email format is invalid');
    }

    const query = 'INSERT INTO projects (name, status, client_name, client_email, client_phone, created_by_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *';
    const values = [data.name, 'draft', data.client_name, data.client_email, data.client_phone || null, data.created_by_id];

    const result = await pool.query(query, values);
    return result.rows[0] as Project;
  } catch (error: any) {
    if (error instanceof ValidationError) {
      logger.error(error.message);
      throw error;
    }
    if (error.code === '23505') {
      logger.error('Project with name already exists');
      throw new ConflictError('Project with name already exists');
    }
    logger.error('Failed to create project: ' + error.message);
    throw new DatabaseError('Failed to create project: ' + error.message);
  }
}

async function update(id: number, data: Partial<{ name: string, status: string, client_name: string, client_email: string, client_phone: string }>, userId: number): Promise<Project> {
  try {
    const project = await findById(id);
    if (project === null) {
      throw new NotFoundError('Project not found');
    }

    if (project.locked_by_user_id && project.locked_by_user_id !== userId) {
      throw new ConflictError('Project is locked by user ID ' + project.locked_by_user_id);
    }

    const fields = Object.keys(data);
    if (fields.length === 0) {
      return project;
    }

    const setClauses = fields.map((field, index) => `${field} = $${index + 2}`);
    const query = `UPDATE projects SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *`;
    const values = [id, ...fields.map(field => (data as any)[field])];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new ConflictError('Project was modified or deleted');
    }

    return result.rows[0] as Project;
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
      logger.error(error.message);
      throw error;
    }
    logger.error('Failed to update project: ' + error.message);
    throw new DatabaseError('Failed to update project: ' + error.message);
  }
}

async function softDelete(id: number): Promise<void> {
  try {
    const query = 'UPDATE projects SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Project with id ' + id + ' not found or already deleted');
    }
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      logger.error(error.message);
      throw error;
    }
    logger.error('Failed to delete project: ' + error.message);
    throw new DatabaseError('Failed to delete project: ' + error.message);
  }
}

async function lockForEdit(id: number, userId: number): Promise<Project> {
  try {
    const project = await findById(id);
    if (project === null) {
      throw new NotFoundError('Project not found');
    }

    if (project.locked_by_user_id !== null && project.locked_by_user_id !== userId) {
      throw new ConflictError('Project locked by user ' + project.locked_by_user_id + ' at ' + project.locked_at);
    }

    const query = 'UPDATE projects SET locked_by_user_id = $1, locked_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *';
    const result = await pool.query(query, [userId, id]);

    return result.rows[0] as Project;
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      logger.error(error.message);
      throw error;
    }
    logger.error('Failed to lock project: ' + error.message);
    throw new DatabaseError('Failed to lock project: ' + error.message);
  }
}

async function releaseLock(id: number, userId: number): Promise<void> {
  try {
    const query = 'UPDATE projects SET locked_by_user_id = NULL, locked_at = NULL WHERE id = $1 AND locked_by_user_id = $2 AND deleted_at IS NULL';
    const result = await pool.query(query, [id, userId]);

    if (result.rowCount === 0) {
      throw new ConflictError('Cannot release lock: project not locked by user ' + userId);
    }
  } catch (error: any) {
    if (error instanceof ConflictError) {
      logger.error(error.message);
      throw error;
    }
    logger.error('Failed to release lock: ' + error.message);
    throw new DatabaseError('Failed to release lock: ' + error.message);
  }
}

export { findAll, findById, create, update, softDelete, lockForEdit, releaseLock };