const { JOB_ENTRY_STATUS, JOB_STATUS, AUTOMATE_ACTION, DAILY_CONFIG_AUTOMATION_TYPE: WORKDAY_CONFIG_AUTOMATION_TYPE } = require('../interface')
const { db } = require('../database');
const { executeAction } = require('../assistant-app');

// store boolean if the job is cancelled
let isCancelled = false;

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


function timeToExecute(dueDate, now) {
    const thresholdMinutes = 1
    return Math.abs(dueDate.getTime() - now.getTime()) < thresholdMinutes * 60 * 1000
}

async function shouldExecute(user, action, dueDate, now) {
    // if no successful record in 'log_entry' table for given user, given action, for dueDate



}
async function getDailyConfig(username, date) {
    const queryResult = await db.query(`SELECT dc.date, dc.start_at, dc.end_at, dc.automation_type
                    FROM daily_config dc JOIN login_info li ON dc.login_info_id = li.id
                    WHERE li.username = $1 AND date dc.date = $2;`, [username, date.toISOString().substring(0, 10)])

    if (queryResult.rowCount === 0) {
        return null;
    } else {
        const firstRow = queryResult.rows[0];
        return new WorkdayConfig(firstRow.username, firstRow.start_at, firstRow.end_at, firstRow.date, firstRow.automation_type)
    }
}


async function checkForExecutionFailure() {

}

async function getWeeklyConfig(username, date) {
    const today = dayOfWeekToAbbrv(date.getDay())
    const queryResult = await db.query(`SELECT wwc.day, wwc.start_at, wwc.end_at, li.username
                                        FROM work_week_config wwc JOIN login_info li on wwc.login_info_id = li.id
                                        WHERE li.username = $1 AND LOWER(wwc.day) = $2;`, [username, today])
    if (queryResult.rowCount > 0) {
        const firstRow = queryResult.rows[0];
        return new WorkdayConfig(firstRow.username, firstRow.start_at, firstRow.end_at, date, WORKDAY_CONFIG_AUTOMATION_TYPE.AUTOMATE);
    } else {
        return null;
    }
}

class ActionLogEntry {
    constructor(user, action, status, message, error, timestamp) {
        this.user = user;
        this.action = action;
        this.status = status;
        this.message = message;
        this.error = error;
        this.timestamp = timestamp;
    }
}


class WorkdayConfig {
    /**
     * 
     * @param {string} username 
     * @param {string} startAt 14:00
     * @param {string} endAt 22:00
     * @param {string | Date} date 
     * @param {WORKDAY_CONFIG_AUTOMATION_TYPE} automation_type 
     */
    constructor(username, startAt, endAt, date, automation_type) {
        this.username = username;

        this.startAt = new Date(date);
        this.startAt.setHours(+startAt.split(':')[0])
        this.startAt.setMinutes(+startAt.split(':')[1])
        console.log('user start at: ', this.startAt)

        this.endAt = new Date(date);
        this.endAt.setHours(+endAt.split(':')[0])
        this.endAt.setMinutes(+endAt.split(':')[1])
        console.log('user end at: ', this.endAt)


        if (date instanceof Date) {
            this.date = date
        } else {
            this.date = new Date(Date.parse(date))
        }

        const allDates = [this.startAt, this.endAt, date]
        for (const d in allDates) {
            if (d.toString().toLowerCase().includes('invalid')) {
                throw new Error('invalid date: ' + allDates)
            }
        }

        if (!Object.values(WORKDAY_CONFIG_AUTOMATION_TYPE).includes(automation_type)) {
            throw new Error(`invalid automation type: ${automation_type}`)
        }

        this.automation_type = automation_type;
    }
}

(async () => {

    const LOOKUP_INTERVAL = '5 minutes'

    // TODO: fetch users
    const usersToAutomate = [];

    let actionPromises = [];

    for (const user in usersToAutomate) {

        const { abbrevToDayOfWeek, dayOfWeekToAbbrv } = require('../util')
        const now = new Date()

        const dailyConfig = getDailyConfig(user.username, now)
        let selectedConfig = dailyConfig;

        if (dailyConfig && dailyConfig.automation_type === WORKDAY_CONFIG_AUTOMATION_TYPE.NO_AUTOMATE) {
            console.log(`[AUTOMATION]: user ${user.username} requested no automation for date: ${dailyConfig.date}`);
            actionPromises.push(new Promise((res, rej) => {
                res({
                    workdayConfig: dailyConfig,
                    result: 'Skipping automation as requested'
                })
            }))
            continue;
        } else {
            selectedConfig = getWeeklyConfig(user.username, now)
        }

        if (selectedConfig === null) {
            console.log(`User ${user.username}. No configurations found`)
            return;
        }

        let action = null;
        let dueDate = null;
        if (timeToExecute(userStartAt, now)) {
            action = AUTOMATE_ACTION.START_BTN;
            dueDate = userStartAt;
        } else if (timeToExecute(userEndAt, now)) {
            action = AUTOMATE_ACTION.STOP_BTN;
            dueDate = userEndAt;
        }

        if (shouldExecute(user, action, dueDate, now)) {
            if (checkForExecutionFailure(user, action, dueDate)) {
                // TOOD: notify user if not already

            } else {
                console.log(`Executing action ${action} for user ${user.username}.\nworkday: ${JSON.stringify(userWorkday)}`)
                actionPromises.push(executeAction(user, action));
            }

        } else {
            console.log(`NOT executing action ${action} for user ${user.username}.\nworkday: ${JSON.stringify(userWorkday)}`)
        }
    }

    const actionResults = await Promise.allSettled(actionPromises)

    // TODO: rework
    for (let idx = 0; idx < actionResults.length; idx++) {
        const cur_job = queryResult.rows[idx];
        const cur_job_result = actionResults[idx]
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
