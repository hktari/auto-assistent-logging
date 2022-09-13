const winston = require('winston')
const dailyRotate = require("winston-daily-rotate-file");

const { format } = require('logform');

const alignedWithColorsAndTime = format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

const options = {
    errFile: new winston.transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD-HH',
        level: 'error',

    }),
    logFile: new winston.transports.DailyRotateFile({
        filename: 'logs/all-%DATE%.log',
        datePattern: 'YYYY-MM-DD-HH',
        level: 'debug'
    }),
    console: new winston.transports.Console({
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
        format: alignedWithColorsAndTime
    }),
};

const logger = winston.createLogger({
    level: 'info',
    transports: [
        options.logFile,
        options.errFile,
    ],
    exitOnError: false
})

// If we're not in production then log to the `console`  
if (process.env.NODE_ENV !== 'production') {
    logger.add(options.console);
}

module.exports = logger