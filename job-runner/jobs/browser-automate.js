const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig } = require('../interface')
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

async function shouldExecute(username, action, dueDate, now) {
    // if no successful record in 'log_entry' table for given user, given action, for dueDate
    const queryResult = await db.query(`SELECT *
                                        FROM log_entry le JOIN login_info li on le.login_info_id = li.id
                                        WHERE li.username = $1 
                                        AND date_trunc('day', le.timestamp) = date_trunc('day', timestamp $2)
                                        AND action = $3
                                        AND status = $4;`, [username, dueDate, action, LOG_ENTRY_STATUS.SUCCESSFUL])
    if (queryResult.rowCount > 0) {
        console.debug(`Already executed sucessfully action ${action} today for user ${username}`)
        return false;
    } else {
        return true;
    }
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
    return Promise.resolve(false);
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

/**
 * Get user data from the 'user' and 'login_info' tables
 * @param {boolean} onlyAutomateEnabled 
 */
async function getUsers(onlyAutomateEnabled = true) {
    const queryResult = await db.query(`SELECT li.id as login_info_id, a.email, a."automationEnabled", li.username, li.password
                                        FROM account a JOIN login_info li on a.id = li.user_id
                                        WHERE "automationEnabled" = ${onlyAutomateEnabled};`)

    // TODO: decrypt password
    return queryResult.rows;
}

(async () => {

    const LOOKUP_INTERVAL = '5 minutes'

    const usersToAutomate = await getUsers();

    let actionPromises = [];

    for (const user in usersToAutomate) {

        const { abbrevToDayOfWeek, dayOfWeekToAbbrv } = require('../util')
        const now = new Date()

        const dailyConfig = await getDailyConfig(user.username, now)
        let selectedConfig = dailyConfig;

        if (dailyConfig && dailyConfig.automation_type === WORKDAY_CONFIG_AUTOMATION_TYPE.NO_AUTOMATE) {
            console.log(`[AUTOMATION]: user ${user.username} requested no automation for date: ${dailyConfig.date}`);
            actionPromises.push(new Promise((res, rej) => {
                res({
                    user: user,
                    workdayConfig: selectedConfig,
                    action: null,
                    result: 'Skipping automation as requested'
                })
            }))
            continue;
        } else {
            selectedConfig = await getWeeklyConfig(user.username, now)
        }

        if (selectedConfig === null) {
            console.log(`User ${user.username}. No configurations found`)
            return;
        }

        let action = null;
        let dueDate = null;
        if (timeToExecute(selectedConfig.startAt, now)) {
            action = AUTOMATE_ACTION.START_BTN;
            dueDate = selectedConfig.startAt;
        } else if (timeToExecute(selectedConfig.endAt, now)) {
            action = AUTOMATE_ACTION.STOP_BTN;
            dueDate = selectedConfig.endAt;
        }

        if (await shouldExecute(user.username, action, dueDate)) {
            if (await checkForExecutionFailure(user.username, action, dueDate)) {
                // TOOD: notify user if not already

            } else {
                console.log(`Executing action ${action} for user ${user.username}.\nworkday: ${JSON.stringify(selectedConfig)}`)
                actionPromises.push(async () => {
                    return {
                        user: user,
                        action: action,
                        workdayConfig: selectedConfig,
                        result: await executeAction(user.username, action)
                    }
                });
            }

        } else {
            console.log(`NOT executing action ${action} for user ${user.username}.\nworkday: ${JSON.stringify(selectedConfig)}`)
        }
    }

    const actionResults = await Promise.allSettled(actionPromises)

    // TODO: rework
    /**
     *    {
            "status": "fullfilled",
            "reason": "err",
            "value": {
                "user": {
                    "username": "joža"
                    ...
                },
                "result": "Successfully executed action"
            }
        }
     
     */
    for (const actionResult in actionResults) {
        const successful = actionResult.status === 'fulfilled'
        const curUser = actionResult.value.user;

        console.info(`[AUTOMATION]: saving job results...: ${JSON.stringify(actionResult)}`)

        try {
            const logEntryStatus = actionResult.status === 'fulfilled' ? LOG_ENTRY_STATUS.SUCCESSFUL : LOG_ENTRY_STATUS.FAILED;
            const logEntryErr = successful ? null : actionResult.reason.toString();
            const logEntryMsg = actionResult.value.result;

            // log job execution
            const queryResult = await db.query(`INSERT INTO log_entry (login_info_id, status, "timestamp", error, message, "action")
                            VALUES ($1, $2, $3, $4, $5, $6);`,
                [curUser.login_info_id, logEntryStatus, now, logEntryErr, logEntryMsg, actionResult.value.action])
            console.log('[AUTOMATION]: inserted ' + queryResult.rowCount + ' rows');
        } catch (error) {
            console.log('[AUTOMATION]: Error adding log entry');
            console.log(error)
        }
    }

    // signal to parent that the job is done
    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
})();
