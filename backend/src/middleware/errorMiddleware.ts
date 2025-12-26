import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error(err.message, { stack: err.stack, path: req.path });

  if (err.name === 'ValidationError') {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Unauthorized', message: err.message });
    return;
  }

  if (err.name === 'ConflictError') {
    res.status(409).json({ error: err.message });
    return;
  }

  if (err.name === 'DatabaseError') {
    res.status(500).json({ error: 'Database error', message: 'Internal server error' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not found', message: `Route ${req.method} ${req.path} does not exist` });
};