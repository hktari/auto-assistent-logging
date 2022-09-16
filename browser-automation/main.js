
const Bree = require('bree');
// const Graceful = require('@ladjs/graceful');
const Cabin = require('cabin');
let assistantJob = {
    name: 'browser-automation-job',
    // run on start as well
    // timeout: 0
}

if (process.env.NODE_ENV === 'development') {
    require('dotenv').config()
    assistantJob.interval = '5s';
} else {
    assistantJob.cron = '*/5 * * * *';
}

const bree = new Bree({
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