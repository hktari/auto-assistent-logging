var winston = require('winston'),
    WinstonCloudWatch = require('winston-cloudwatch');

var NODE_ENV = process.env.NODE_ENV || 'development';

const logger = winston.createLogger({
    transports: [
        new (winston.transports.Console)({
            timestamp: true,
            colorize: true,
        })
    ]
});

var config = {
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
    logStreamName: NODE_ENV,
    createLogGroup: false,
    createLogStream: true,
    uploadRate: 2000,
    awsAccessKeyId: process.env.CLOUDWATCH_ACCESS_KEY_ID,
    awsSecretKey: process.env.CLOUDWATCH_SECRET_ACCESS_KEY,
    awsRegion: process.env.CLOUDWATCH_REGION,
    messageFormatter: function (item) {
        return item.level + ': ' + item.message + ' ' + JSON.stringify(item.meta)
    }
}

if (NODE_ENV != 'development') {
    logger.add(new WinstonCloudWatch(config));
}

logger.level = process.env.LOG_LEVEL || "silly";
//
// Handle errors originating in the logger itself
//
logger.on('error', function (err) {
    console.log('winston error: ' + err)
});

module.exports = logger;
