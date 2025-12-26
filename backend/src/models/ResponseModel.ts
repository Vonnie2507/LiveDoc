import { pool } from '../config/database';
import { Response } from '../types/models';
import { DatabaseError } from '../utils/errorHandlers';

export async function create(data: { projectId: number; questionId: number; value: string; answeredBy: number }): Promise<Response> {
  try {
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [data.projectId]
    );
    if (projectCheck.rows.length === 0) {
      throw new DatabaseError('Invalid projectId, questionId, or answeredBy reference');
    }

    const questionCheck = await pool.query(
      'SELECT id FROM questions WHERE id = $1',
      [data.questionId]
    );
    if (questionCheck.rows.length === 0) {
      throw new DatabaseError('Invalid projectId, questionId, or answeredBy reference');
    }

    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [data.answeredBy]
    );
    if (userCheck.rows.length === 0) {
      throw new DatabaseError('Invalid projectId, questionId, or answeredBy reference');
    }

    const result = await pool.query(
      'INSERT INTO responses (project_id, question_id, value, answered_by, answered_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [data.projectId, data.questionId, data.value, data.answeredBy]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      projectId: row.project_id,
      questionId: row.question_id,
      value: row.value,
      answeredBy: row.answered_by,
      answeredAt: row.answered_at
    };
  } catch (error: any) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    if (error.code === '23503') {
      throw new DatabaseError('Invalid projectId, questionId, or answeredBy reference');
    }
    throw new DatabaseError(`Failed to create response: ${error.message}`);
  }
}

export async function findByProjectId(projectId: number): Promise<Response[]> {
  try {
    const result = await pool.query(
      'SELECT r.id, r.project_id, r.question_id, r.value, r.answered_by, r.answered_at, q.stage_id, q.question_code, q.label FROM responses r JOIN questions q ON r.question_id = q.id WHERE r.project_id = $1 ORDER BY r.answered_at DESC',
      [projectId]
    );

    return result.rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      questionId: row.question_id,
      value: row.value,
      answeredBy: row.answered_by,
      answeredAt: row.answered_at,
      question: {
        stageId: row.stage_id,
        questionCode: row.question_code,
        label: row.label
      }
    }));
  } catch (error: any) {
    throw new DatabaseError(`Failed to retrieve responses for project ${projectId}: ${error.message}`);
  }
}

export async function findByQuestionId(questionId: number): Promise<Response[]> {
  try {
    const result = await pool.query(
      'SELECT r.id, r.project_id, r.question_id, r.value, r.answered_by, r.answered_at, p.project_name FROM responses r JOIN projects p ON r.project_id = p.id WHERE r.question_id = $1 ORDER BY r.answered_at DESC',
      [questionId]
    );

    return result.rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      questionId: row.question_id,
      value: row.value,
      answeredBy: row.answered_by,
      answeredAt: row.answered_at,
      projectName: row.project_name
    }));
  } catch (error: any) {
    throw new DatabaseError(`Failed to retrieve responses for question ${questionId}: ${error.message}`);
  }
}