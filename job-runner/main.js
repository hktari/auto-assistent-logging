
const Bree = require('bree');
// const Graceful = require('@ladjs/graceful');
const Cabin = require('cabin');
require('dotenv').config()


//
// we recommend using Cabin as it is security-focused
// and you can easily hook in Slack webhooks and more
// <https://cabinjs.com>
//
const logger = new Cabin();

const bree = new Bree({
    logger,
    jobs: [
        {
            // runs `./jobs/email.js` every minute
            name: 'browser-automate',
            interval: '5s',
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
    try {
        await bree.start();        
    } catch (error) {
        console.error(error)
    }
})();