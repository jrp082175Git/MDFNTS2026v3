const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const { getDateKey } = require('../utils/dateKey');

let loggerInstance = null;

function initLogger(config, usersStr) {
  if (loggerInstance) return loggerInstance;

  const logsDir = path.resolve(__dirname, '../../logs');
  const dateStr = getDateKey();
  const filename = `Receiver_${usersStr ? usersStr + '_' : ''}%DATE%.log`;

  const transport = new DailyRotateFile({
    dirname: logsDir,
    filename: filename,
    datePattern: 'YYYYMMDD',
    zippedArchive: false,
    maxSize: config.logging.maxSize || '20m',
    maxFiles: config.logging.maxFiles || '14d',
    level: config.logging.level || 'info'
  });

  const logger = winston.createLogger({
    level: config.logging.level || 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
    ),
    transports: [
      new winston.transports.Console(),
      transport
    ]
  });

  loggerInstance = logger;
  return logger;
}

function getLogger() {
  if (!loggerInstance) {
    // Fallback to basic console logger if accessed before initialization
    return console;
  }
  return loggerInstance;
}

module.exports = { initLogger, getLogger };
