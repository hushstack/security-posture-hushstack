import pino from 'pino';
import { createWriteStream } from 'fs';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Ensure logs directory exists
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log levels
const infoStream = createWriteStream(join(logsDir, 'info.log'), { flags: 'a' });
const errorStream = createWriteStream(join(logsDir, 'error.log'), { flags: 'a' });
const debugStream = createWriteStream(join(logsDir, 'debug.log'), { flags: 'a' });

// Create logger with multiple transports
export const logger = pino({
  level: process.env.LOG_LEVEL || 'debug',
  base: {
    pid: process.pid,
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
}, pino.multistream([
  { stream: infoStream, level: 'info' },
  { stream: errorStream, level: 'error' },
  { stream: debugStream, level: 'debug' },
]));

// Helper functions for common logging patterns
export const logRequest = (method: string, path: string, ip?: string) => {
  logger.info({ method, path, ip }, `Request: ${method} ${path}`);
};

export const logResponse = (method: string, path: string, status: number, duration: number) => {
  logger.info({ method, path, status, duration: `${duration}ms` }, `Response: ${method} ${path} ${status} (${duration}ms)`);
};

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error({ error: error.message, stack: error.stack, ...context }, error.message);
};

export const logDebug = (message: string, data?: Record<string, unknown>) => {
  logger.debug({ ...data }, message);
};

export const logInfo = (message: string, data?: Record<string, unknown>) => {
  logger.info({ ...data }, message);
};

export const logWarn = (message: string, data?: Record<string, unknown>) => {
  logger.warn({ ...data }, message);
};
