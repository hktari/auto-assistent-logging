
const Bree = require('bree');
// const Graceful = require('@ladjs/graceful');
const Cabin = require('cabin');
require('dotenv').config()

const bree = new Bree({
    jobs: [
        {
            // runs `./jobs/email.js` every minute
            name: 'auto-assistant',
            // interval: '5s',
            cron: '* * * 5 *',
            // run on start as well
            timeout: 0
        }
    ]
});

// handle graceful reloads, pm2 support, and events like SIGHUP, SIGINT, etc.
// const graceful = new Graceful({ brees: [bree] });
// graceful.listen();

// start all jobs (this is the equivalent of reloading a crontab):
(async () => {
    await bree.start();
})();