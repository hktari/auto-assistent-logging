const os = require('os');
const process = require('process');
const { parentPort } = require('worker_threads');

const Cabin = require('cabin');
// const pMap = require('p-map');

const assistantApp = require('../assistant-app')

const { JOB_ENTRY_STATUS, JOB_STATUS, AUTOMATE_ACTION } = require('../interface')

//
// we recommend using Cabin as it is security-focused
// and you can easily hook in Slack webhooks and more
// <https://cabinjs.com>
//
const console = new Cabin();

// store boolean if the job is cancelled
let isCancelled = false;

// how many emails to send at once
const concurrency = os.cpus().length;

const { db } = require('../database')

async function mapper(result) {
    // return early if the job was already cancelled
    if (isCancelled) return;
    try {
        const response = await email.send(result);
        console.info('sent email', { response });
        // here is where you would write to the database that it was sent
        return response;
    } catch (err) {
        // catch the error so if one email fails they all don't fail
        console.erroror(err);
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

    // TODO: fetch users
    const usersToAutomate = [];

    for (const user in usersToAutomate) {
        const userWorkweek = {}
        const today = new Date().getDay()

    }
    let jobs = [];
    for (const row of queryResult.rows) {
        console.info(`[AUTOMATION]: queueing: ${JSON.stringify(row)}`)
        jobs.push(
            assistantApp.executeAction({ username: row.username, password: row.password, action: row.action }))
    }

    const job_results = await Promise.allSettled(jobs)

    for (let idx = 0; idx < job_results.length; idx++) {
        const cur_job = queryResult.rows[idx];
        const cur_job_result = job_results[idx]
        const successful = cur_job_result.status === 'fulfilled'

        console.info(`[AUTOMATION]: saving job results...: ${JSON.stringify(cur_job_result)}`)

        try {
            const job_entry_status = cur_job_result.status === 'fulfilled' ? JOB_ENTRY_STATUS.SUCCESSFUL : JOB_ENTRY_STATUS.FAILED

            // log job execution
            await db.query(`INSERT INTO job_run_entry (job_id, message, status, "timestamp")
                        VALUES(${cur_job.id}, $1, $2, now())`,
                [successful ? cur_job_result.value : cur_job_result.reason.toString(), job_entry_status])
        } catch (error) {
            console.log('[AUTOMATION]: Error adding job execution entry');
            console.log(error)
            // TODO: return ?
        }


        const success = await db.query(`UPDATE job
                                SET status = $1, error_message = $2
                                WHERE id = ${cur_job.id}`, [successful ? JOB_STATUS.COMPLETED : JOB_STATUS.FAILED, cur_job_result.reason?.toString()])
        if (success) {
            console.log('[AUTOMATION]: UPDATE job [SUCCESS]')
        } else {
            console.log('[AUTOMATION]: failed to update job:', JSON.stringify(cur_job))
        }
    }

    // query databaseand iterate over them with concurrency
    // await pMap(queryResult.rows, mapper, { concurrency });

    // signal to parent that the job is done
    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
})();
