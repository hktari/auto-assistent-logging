const os = require('os');
const process = require('process');
const { parentPort } = require('worker_threads');

const Cabin = require('cabin');
// const pMap = require('p-map');

const assistantApp = require('../assistant-app')

//
// we recommend using Cabin as it is security-focused
// and you can easily hook in Slack webhooks and more
// <https://cabinjs.com>
//
const logger = new Cabin();

// store boolean if the job is cancelled
let isCancelled = false;

// how many emails to send at once
const concurrency = os.cpus().length;

const { query } = require('../database')

async function mapper(result) {
    // return early if the job was already cancelled
    if (isCancelled) return;
    try {
        const response = await email.send(result);
        logger.info('sent email', { response });
        // here is where you would write to the database that it was sent
        return response;
    } catch (err) {
        // catch the error so if one email fails they all don't fail
        logger.error(err);
    }
}

// handle cancellation (this is a very simple example)
if (parentPort)
    parentPort.once('message', (message) => {
        //
        // TODO: once we can manipulate concurrency option to p-map
        // we could make it `Number.MAX_VALUE` here to speed cancellation up
        // <https://github.com/sindresorhus/p-map/issues/28>
        //
        if (message === 'cancel') isCancelled = true;
    });


(async () => {

    const LOOKUP_INTERVAL = '5 minutes'

    // TODO: select only the jobs in the give interval
    const queryResult = await query(`SELECT * 
                                    from job
                                    JOIN login_info ON login_info.id = job.login_info_id
                                    where status != 'COMPLETED' AND (
                                        (execute_time - interval '$1') <= now() AND
                                        (execute_time + interval '$1') >= now()	
                                    )`, LOOKUP_INTERVAL)


    for (const row of queryResult.rows) {
        logger.info(`running: ` + JSON.stringify(row))
        await assistantApp.executeAction({ username: row.username, password: row.password, action: row.action })

    }
    // query databaseand iterate over them with concurrency
    // await pMap(queryResult.rows, mapper, { concurrency });

    // signal to parent that the job is done
    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
})();
