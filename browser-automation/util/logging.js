var winston = require('winston'),
    WinstonCloudWatch = require('winston-cloudwatch');

var NODE_ENV = process.env.NODE_ENV || 'development';
const { format } = require('logform');

const alignedWithColorsAndTime = format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);
const logger = winston.createLogger({
    transports: [
    ]
});

console.log('setting log level to: ' + (process.env.LOG_LEVEL || "silly"))
logger.level = process.env.LOG_LEVEL || "silly";


logger.add(new winston.transports.Console({
    timestamp: true,
    colorize: true,
    format: alignedWithColorsAndTime
}))


var config = {
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
    logStreamName: NODE_ENV,
    createLogGroup: false,
    createLogStream: true,
    uploadRate: 2000,
    level: logger.level,
    awsAccessKeyId: process.env.CLOUDWATCH_ACCESS_KEY_ID,
    awsSecretKey: process.env.CLOUDWATCH_SECRET_ACCESS_KEY,
    awsRegion: process.env.CLOUDWATCH_REGION,
    messageFormatter: function (item) {
        return item.level + ': ' + item.message + ' ' + (item ? JSON.stringify(item.meta) : '')
    }
}

if (NODE_ENV === 'production' || NODE_ENV === 'test') {
    logger.add(new WinstonCloudWatch(config));
}


//
// Handle errors originating in the logger itself
//
logger.on('error', function (err) {
    console.log('winston error: ' + err)
});

module.exports = logger;
