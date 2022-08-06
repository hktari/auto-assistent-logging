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

const { db } = require('../database');
const { executeAction } = require('../assistant-app');

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

    let actionPromises = [];

    for (const user in usersToAutomate) {

        const { abbrevToDayOfWeek, dayOfWeekToAbbrv } = require('../util')
        const today = dayOfWeekToAbbrv(new Date().getDay())

        /**
         * {
            "login_info_id": "6bbb7678-31e3-49c6-bd16-9996c9094c41",
            "day": "mon",
            "start_at": "14:00",
            "end_at": "22:00",
        }
         */
        // TODO: fetch user workday for today
        const userWorkday = {}


        const userStartAt = new Date(), userEndAt = new Date()
        userStartAt.setHours(+userWorkday.start_at.split(':')[0])
        userStartAt.setMinutes(+userWorkday.start_at.split(':')[1])
        console.log('user start at: ', userStartAt)

        userEndAt.setHours(+userWorkday.end_at.split(':')[0])
        userEndAt.setMinutes(+userWorkday.end_at.split(':')[1])
        console.log('user end at: ', userStartAt)

        let action = null;
        if (timeToExecute(userStartAt)) {
            action = AUTOMATE_ACTION.START_BTN;
        } else if (timeToExecute(userEndAt)) {
            action = AUTOMATE_ACTION.STOP_BTN;
        }

        // if no successful record in 'log_entry' table for given user 
        if (shouldExecute(user, action, userWorkday)) {
            console.log(`Executing action ${action} for user ${user.username}.\nworkday: ${JSON.stringify(userWorkday)}`)
            actionPromises.push(executeAction(user, action));
        } else {
            console.log(`NOT executing action ${action} for user ${user.username}.\nworkday: ${JSON.stringify(userWorkday)}`)
        }
    }

    const job_results = await Promise.allSettled(actionPromises)

    // TODO: rework
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
