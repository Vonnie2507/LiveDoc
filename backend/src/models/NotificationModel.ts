import { pool } from '../config/database';
import { Notification } from '../types/models';
import { DatabaseError, ValidationError } from '../utils/errorHandlers';

async function create(data: { userId: number; projectId: number | null; title: string; message: string; type: 'info' | 'warning' | 'error' | 'success' }): Promise<Notification> {
  const validTypes = ['info', 'warning', 'error', 'success'];
  if (!validTypes.includes(data.type)) {
    throw new ValidationError(`Invalid notification type: ${data.type}`);
  }

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [data.userId]);
    if (userCheck.rows.length === 0) {
      throw new DatabaseError('Invalid userId or projectId reference');
    }

    if (data.projectId !== null) {
      const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1', [data.projectId]);
      if (projectCheck.rows.length === 0) {
        throw new DatabaseError('Invalid userId or projectId reference');
      }
    }

    const result = await pool.query(
      'INSERT INTO notifications (user_id, project_id, title, message, type, is_read, created_at) VALUES ($1, $2, $3, $4, $5, false, NOW()) RETURNING *',
      [data.userId, data.projectId, data.title, data.message, data.type]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.is_read,
      createdAt: row.created_at
    };
  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    if (error.code === '23503') {
      throw new DatabaseError('Invalid userId or projectId reference');
    }
    throw new DatabaseError(`Failed to create notification: ${error.message}`);
  }
}

async function findByUserId(userId: number, limit: number = 50): Promise<Notification[]> {
  try {
    const result = await pool.query(
      'SELECT n.id, n.user_id, n.project_id, n.title, n.message, n.type, n.is_read, n.created_at, p.project_name FROM notifications n LEFT JOIN projects p ON n.project_id = p.id WHERE n.user_id = $1 ORDER BY n.created_at DESC LIMIT $2',
      [userId, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.is_read,
      createdAt: row.created_at,
      projectName: row.project_name
    }));
  } catch (error: any) {
    throw new DatabaseError(`Failed to retrieve notifications for user ${userId}: ${error.message}`);
  }
}

async function markAsRead(id: number): Promise<void> {
  try {
    const checkResult = await pool.query('SELECT id FROM notifications WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      throw new ValidationError(`Notification ${id} not found`);
    }

    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError(`Failed to mark notification ${id} as read: ${error.message}`);
  }
}

export { create, findByUserId, markAsRead };