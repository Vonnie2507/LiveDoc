import { ValidationChain, check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateLogin: ValidationChain[] = [
  check('email').isEmail().withMessage('Valid email required'),
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

export const validateProjectCreate: ValidationChain[] = [
  check('client_name').trim().notEmpty().withMessage('Client name required'),
  check('status').isIn(['draft', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status value')
];

export const validateProjectUpdate: ValidationChain[] = [
  check('id').isInt().withMessage('Invalid project ID'),
  check('client_name').optional().trim().notEmpty(),
  check('status').optional().isIn(['draft', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled'])
];

export const validateCommunicationUpload: ValidationChain[] = [
  check('project_id').isInt().withMessage('Valid project ID required'),
  check('source_type').isIn(['email', 'sms', 'voicemail', 'note']).withMessage('Invalid source type'),
  check('content').trim().notEmpty().withMessage('Content required')
];

export const validateExtractionRequest: ValidationChain[] = [
  check('communication_id').isInt().withMessage('Valid communication ID required'),
  check('text_content').optional().trim(),
  check('use_claude').optional().isBoolean()
];

export const validateResponseSubmit: ValidationChain[] = [
  check('project_id').isInt().withMessage('Valid project ID required'),
  check('question_id').isInt().withMessage('Valid question ID required'),
  check('answer_text').trim().notEmpty().withMessage('Answer required')
];

export const validateUserCreate: ValidationChain[] = [
  check('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  check('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/).withMessage('Password must be 8+ chars with uppercase and number'),
  check('role_id').isInt().withMessage('Valid role ID required'),
  check('full_name').trim().notEmpty().withMessage('Full name required')
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const result = validationResult(req);
  
  if (result.isEmpty()) {
    next();
    return;
  }
  
  const errors = result.array();
  const mappedErrors = errors.map(error => ({
    field: 'param' in error ? error.param : 'unknown',
    message: error.msg
  }));
  
  res.status(400).json({
    error: 'Validation failed',
    details: mappedErrors
  });
};