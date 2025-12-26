import { pool } from '../config/database';
import { Extraction } from '../types/models';
import { ValidationError, DatabaseError, NotFoundError } from '../utils/errorHandlers';
import { logger } from '../utils/logger';
import * as ProjectModel from './ProjectModel';
import * as ChangeLogModel from './ChangeLogModel';

async function create(data: { 
  source_communication_id: number, 
  field_name: string, 
  extracted_value: string, 
  confidence_score: number, 
  extraction_status: string 
}): Promise<Extraction> {
  try {
    if (data.confidence_score < 0 || data.confidence_score > 1) {
      throw new ValidationError('confidence_score must be between 0 and 1, got ' + data.confidence_score);
    }

    const validStatuses = ['pending_review', 'confirmed', 'rejected'];
    if (!validStatuses.includes(data.extraction_status)) {
      throw new ValidationError('Invalid extraction_status: must be pending_review, confirmed, or rejected');
    }

    const result = await pool.query(
      'INSERT INTO extractions (source_communication_id, field_name, extracted_value, confidence_score, extraction_status, extracted_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [data.source_communication_id, data.field_name, data.extracted_value, data.confidence_score, data.extraction_status]
    );

    return result.rows[0] as Extraction;
  } catch (error: any) {
    if (error instanceof ValidationError) {
      logger.error('Validation error creating extraction: ' + error.message);
      throw error;
    }
    logger.error('Failed to create extraction: ' + error.message);
    throw new DatabaseError('Failed to create extraction: ' + error.message);
  }
}

async function findBySourceId(sourceCommId: number): Promise<Extraction[]> {
  try {
    const result = await pool.query(
      'SELECT id, source_communication_id, field_name, extracted_value, confidence_score, extraction_status, reviewed_by_id, extracted_at, reviewed_at FROM extractions WHERE source_communication_id = $1 ORDER BY field_name ASC',
      [sourceCommId]
    );

    return result.rows as Extraction[];
  } catch (error: any) {
    logger.error('Failed to retrieve extractions for communication ' + sourceCommId + ': ' + error.message);
    throw new DatabaseError('Failed to retrieve extractions for communication ' + sourceCommId + ': ' + error.message);
  }
}

async function confirm(id: number, reviewedById: number): Promise<Extraction> {
  try {
    const result = await pool.query(
      'UPDATE extractions SET extraction_status = $1, reviewed_by_id = $2, reviewed_at = NOW() WHERE id = $3 RETURNING *',
      ['confirmed', reviewedById, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Extraction with id ' + id + ' not found');
    }

    return result.rows[0] as Extraction;
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      logger.error('Extraction not found: ' + error.message);
      throw error;
    }
    logger.error('Failed to confirm extraction: ' + error.message);
    throw new DatabaseError('Failed to confirm extraction: ' + error.message);
  }
}

async function reject(id: number, reviewedById: number): Promise<Extraction> {
  try {
    const result = await pool.query(
      'UPDATE extractions SET extraction_status = $1, reviewed_by_id = $2, reviewed_at = NOW() WHERE id = $3 RETURNING *',
      ['rejected', reviewedById, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Extraction with id ' + id + ' not found');
    }

    return result.rows[0] as Extraction;
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      logger.error('Extraction not found: ' + error.message);
      throw error;
    }
    logger.error('Failed to reject extraction: ' + error.message);
    throw new DatabaseError('Failed to reject extraction: ' + error.message);
  }
}

async function applyToProject(id: number, projectId: number, userId: number): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT id, source_communication_id, field_name, extracted_value, confidence_score, extraction_status, reviewed_by_id, extracted_at, reviewed_at FROM extractions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Extraction with id ' + id + ' not found');
    }

    const extraction = result.rows[0] as Extraction;

    if (extraction.extraction_status !== 'confirmed') {
      throw new ValidationError('Can only apply confirmed extractions, current status: ' + extraction.extraction_status);
    }

    await ProjectModel.update(projectId, { [extraction.field_name]: extraction.extracted_value }, userId);

    await ChangeLogModel.create({
      project_id: projectId,
      changed_by_id: userId,
      change_type: 'aiExtraction',
      field_name: extraction.field_name,
      old_value: null,
      new_value: extraction.extracted_value,
      source_role: null,
      notes: 'Applied from extraction id ' + id
    });
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      logger.error('Error applying extraction: ' + error.message);
      throw error;
    }
    logger.error('Failed to apply extraction to project: ' + error.message);
    throw error;
  }
}

async function batchApply(ids: number[], projectId: number, userId: number): Promise<void> {
  const errors: string[] = [];

  for (const id of ids) {
    try {
      await applyToProject(id, projectId, userId);
    } catch (error: any) {
      logger.error('Error applying extraction ' + id + ': ' + error.message);
      errors.push('Extraction ' + id + ': ' + error.message);
    }
  }

  if (errors.length > 0) {
    throw new DatabaseError('Batch apply completed with ' + errors.length + ' failures: ' + errors.join('; '));
  }
}

export { create, findBySourceId, confirm, reject, applyToProject, batchApply };