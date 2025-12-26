import { pool } from '../config/database';
import { Question } from '../types/models';
import { ValidationError, DatabaseError } from '../utils/errorHandlers';
import { logger } from '../utils/logger';

export async function findByStage(stage: string): Promise<Question[]> {
  try {
    const validStages = ['initial', 'detailed', 'technical', 'scheduling'];
    if (!validStages.includes(stage)) {
      throw new ValidationError('Invalid stage: must be initial, detailed, technical, or scheduling');
    }

    const result = await pool.query(
      'SELECT id, stage, code, question_text, input_type, display_order, required, depends_on_question_id, depends_on_answer FROM questions WHERE stage = $1 ORDER BY display_order ASC',
      [stage]
    );

    return result.rows as Question[];
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error(`Failed to retrieve questions for stage ${stage}: ${error.message}`);
    throw new DatabaseError('Failed to retrieve questions for stage ' + stage + ': ' + error.message);
  }
}

export async function findByCode(code: string): Promise<Question | null> {
  try {
    const result = await pool.query(
      'SELECT id, stage, code, question_text, input_type, display_order, required, depends_on_question_id, depends_on_answer FROM questions WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as Question;
  } catch (error: any) {
    logger.error(`Failed to find question by code ${code}: ${error.message}`);
    throw new DatabaseError('Failed to find question by code ' + code + ': ' + error.message);
  }
}

export async function findNextQuestions(questionId: number, answerValue: string): Promise<Question[]> {
  try {
    const result = await pool.query(
      'SELECT id, stage, code, question_text, input_type, display_order, required, depends_on_question_id, depends_on_answer FROM questions WHERE depends_on_question_id = $1 AND (depends_on_answer = $2 OR depends_on_answer IS NULL) ORDER BY display_order ASC',
      [questionId, answerValue]
    );

    return result.rows as Question[];
  } catch (error: any) {
    logger.error(`Failed to retrieve next questions for question ${questionId}: ${error.message}`);
    throw new DatabaseError('Failed to retrieve next questions for question ' + questionId + ': ' + error.message);
  }
}