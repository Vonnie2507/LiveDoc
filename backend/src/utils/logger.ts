import winston from 'winston';
import { LOG_LEVEL, LOG_DIR } from '../config/environment';

export function createLogger(): winston.Logger {
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    level: LOG_LEVEL || 'info'
  });

  const fileTransport = new winston.transports.File({
    filename: `${LOG_DIR || './logs'}/application.log`,
    level: 'info',
    maxsize: 5242880,
    maxFiles: 5
  });

  const errorFileTransport = new winston.transports.File({
    filename: `${LOG_DIR || './logs'}/error.log`,
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5
  });

  const logger = winston.createLogger({
    level: LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
      consoleTransport,
      fileTransport,
      errorFileTransport
    ]
  });

  return logger;
}