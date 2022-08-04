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

const { query } = require('../database')

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

    // TODO: select only the jobs in the give interval
    const queryResult = await query(`SELECT * 
                                    from job
                                    JOIN login_info ON login_info.id = job.login_info_id
                                    where status != 'COMPLETED' AND (
                                        (execute_time - interval '$1') <= now() AND
                                        (execute_time + interval '$1') >= now()	
                                    )`, LOOKUP_INTERVAL)


    let jobs = [];
    for (const row of queryResult.rows) {
        console.info(`queueing: ` + JSON.stringify(row))
        jobs.push(
            assistantApp.executeAction({ username: row.username, password: row.password, action: row.action }))
    }

    const job_results = await Promise.allSettled(jobs)

    for (let idx = 0; idx < job_results.length; idx++) {
        const cur_job = jobs[idx];
        const cur_job_result = job_results[idx]
        const successful = cur_job_result.status === 'fulfilled'

        try {
            const job_entry_status = cur_job_result.status === 'fulfilled' ? JOB_ENTRY_STATUS.SUCCESSFUL : JOB_ENTRY_STATUS.FAILED

            // log job execution
            await query(`INSERT INTO job_run_entry (job_id, message, status, "timestamp")
                        VALUES($1, '$2', '$3', now())`,
                [cur_job.id, successful ? cur_job_result.value : cur_job_result.reason.toString(), job_entry_status])
        } catch (error) {
            console.error('Error adding job execution entry');
            console.error(error)
            // TODO: return ?
        }


        query(`UPDATE job
            SET status = '$2', error_message = '$3'
            WHERE id = $1`, [cur_job.id, successful ? JOB_STATUS.COMPLETED : JOB_STATUS.FAILED, cur_job_result.reason?.toString()])
            .then(res => console.debug('UPDATE job [SUCCESS]'))
            .catch(err => console.error('UPDATE JOB [ERROR]: ', err))


    }

    // query databaseand iterate over them with concurrency
    // await pMap(queryResult.rows, mapper, { concurrency });

    // signal to parent that the job is done
    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
})();
