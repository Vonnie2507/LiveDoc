import { pool } from '../config/database';
import { ChangeLog } from '../types/models';
import { ValidationError, DatabaseError } from '../utils/errorHandlers';
import { logger } from '../utils/logger';

async function create(data: { 
  project_id: number, 
  changed_by_id: number, 
  change_type: string, 
  field_name: string | null, 
  old_value: string | null, 
  new_value: string | null, 
  source_role: string | null, 
  notes: string | null 
}): Promise<ChangeLog> {
  try {
    const validChangeTypes = ['standard', 'statusChange', 'aiExtraction', 'note'];
    if (!validChangeTypes.includes(data.change_type)) {
      throw new ValidationError('Invalid change_type: must be standard, statusChange, aiExtraction, or note');
    }

    const query = `
      INSERT INTO change_logs 
      (project_id, changed_by_id, change_type, field_name, old_value, new_value, source_role, notes, changed_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
      RETURNING *
    `;

    const result = await pool.query(query, [
      data.project_id,
      data.changed_by_id,
      data.change_type,
      data.field_name,
      data.old_value,
      data.new_value,
      data.source_role,
      data.notes
    ]);

    return result.rows[0] as ChangeLog;
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error('Failed to create change log', error);
    throw new DatabaseError('Failed to create change log: ' + error.message);
  }
}

async function findByProjectId(projectId: number, limit?: number, offset?: number): Promise<ChangeLog[]> {
  try {
    let query = `
      SELECT id, project_id, changed_by_id, change_type, field_name, old_value, new_value, source_role, notes, changed_at 
      FROM change_logs 
      WHERE project_id = $1 
      ORDER BY changed_at DESC
    `;

    const params: any[] = [projectId];

    if (limit !== undefined) {
      params.push(limit);
      query += ` LIMIT $${params.length}`;
    }

    if (offset !== undefined) {
      params.push(offset);
      query += ` OFFSET $${params.length}`;
    }

    const result = await pool.query(query, params);
    return result.rows as ChangeLog[];
  } catch (error: any) {
    logger.error('Failed to retrieve change logs for project', error);
    throw new DatabaseError('Failed to retrieve change logs for project ' + projectId + ': ' + error.message);
  }
}

async function findByUserId(userId: number, limit?: number): Promise<ChangeLog[]> {
  try {
    let query = `
      SELECT id, project_id, changed_by_id, change_type, field_name, old_value, new_value, source_role, notes, changed_at 
      FROM change_logs 
      WHERE changed_by_id = $1 
      ORDER BY changed_at DESC
    `;

    const params: any[] = [userId];

    if (limit !== undefined) {
      params.push(limit);
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    return result.rows as ChangeLog[];
  } catch (error: any) {
    logger.error('Failed to retrieve change logs for user', error);
    throw new DatabaseError('Failed to retrieve change logs for user ' + userId + ': ' + error.message);
  }
}

export { create, findByProjectId, findByUserId };