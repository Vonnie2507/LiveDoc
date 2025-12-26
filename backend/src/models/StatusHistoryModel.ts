import { pool } from '../config/database';
import { StatusHistory } from '../types/models';
import { DatabaseError, ValidationError } from '../utils/errorHandlers';

const ALLOWED_STATUSES = ['draft', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled'];

async function create(data: { projectId: number; fromStatus: string | null; toStatus: string; changedBy: number; notes: string | null }): Promise<StatusHistory> {
  try {
    const projectCheckResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [data.projectId]
    );
    
    if (projectCheckResult.rows.length === 0) {
      throw new DatabaseError('Invalid projectId or changedBy reference');
    }

    const userCheckResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [data.changedBy]
    );
    
    if (userCheckResult.rows.length === 0) {
      throw new DatabaseError('Invalid projectId or changedBy reference');
    }

    if (!ALLOWED_STATUSES.includes(data.toStatus)) {
      throw new ValidationError(`Invalid status value: ${data.toStatus}`);
    }

    if (data.fromStatus !== null && !ALLOWED_STATUSES.includes(data.fromStatus)) {
      throw new ValidationError(`Invalid status value: ${data.fromStatus}`);
    }

    const result = await pool.query(
      'INSERT INTO status_history (project_id, from_status, to_status, changed_by, changed_at, notes) VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING *',
      [data.projectId, data.fromStatus, data.toStatus, data.changedBy, data.notes]
    );

    return result.rows[0];
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof DatabaseError) {
      throw error;
    }
    if (error.code === '23503') {
      throw new DatabaseError('Invalid projectId or changedBy reference');
    }
    throw new DatabaseError(`Failed to create status history: ${error.message}`);
  }
}

async function findByProjectId(projectId: number): Promise<StatusHistory[]> {
  try {
    const result = await pool.query(
      'SELECT sh.id, sh.project_id, sh.from_status, sh.to_status, sh.changed_by, sh.changed_at, sh.notes, u.full_name as changer_name FROM status_history sh JOIN users u ON sh.changed_by = u.id WHERE sh.project_id = $1 ORDER BY sh.changed_at DESC',
      [projectId]
    );

    return result.rows;
  } catch (error: any) {
    throw new DatabaseError(`Failed to retrieve status history for project ${projectId}: ${error.message}`);
  }
}

export { create, findByProjectId };