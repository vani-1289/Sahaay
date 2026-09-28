import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const baseLogger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction || isTest
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
});

export const logger = {
  info: (msg: string, meta?: Record<string, unknown> | unknown) => {
    if (meta !== undefined) {
      baseLogger.info(meta, msg);
    } else {
      baseLogger.info(msg);
    }
  },
  warn: (msg: string, meta?: Record<string, unknown> | unknown) => {
    if (meta !== undefined) {
      baseLogger.warn(meta, msg);
    } else {
      baseLogger.warn(msg);
    }
  },
  error: (msg: string, meta?: Record<string, unknown> | unknown) => {
    if (meta !== undefined) {
      baseLogger.error(meta, msg);
    } else {
      baseLogger.error(msg);
    }
  },
  debug: (msg: string, meta?: Record<string, unknown> | unknown) => {
    if (meta !== undefined) {
      baseLogger.debug(meta, msg);
    } else {
      baseLogger.debug(msg);
    }
  },
  raw: baseLogger,
};

export default logger;
