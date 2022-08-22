
const Bree = require('bree');
// const Graceful = require('@ladjs/graceful');
const Cabin = require('cabin');
require('dotenv').config()
const logger = require('./util/logging')
let assistantJob = {
    name: 'auto-assistant',
    // run on start as well
    // timeout: 0
}

if (process.env.NODE_ENV === 'development') {
    assistantJob.interval = '5s';
} else {
    assistantJob.cron = '*/5 * * * *';
}

const bree = new Bree({
    logger: logger,
    jobs: [
        assistantJob
    ]
});

// handle graceful reloads, pm2 support, and events like SIGHUP, SIGINT, etc.
// const graceful = new Graceful({ brees: [bree] });
// graceful.listen();

// start all jobs (this is the equivalent of reloading a crontab):
(async () => {
    await bree.start();
})();