const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig } = require('../interface')
const db = require('../dbFacade')
const { executeAction, MDDSZApiError } = require('../mddsz-api');

const { parentPort } = require('worker_threads');
const { exit } = require('process');

// store boolean if the job is cancelled
let isCancelled = false;

// handle cancellation (this is a very simple example)
if (parentPort) {
    parentPort.once('message', (message) => {
        //
        // TODO: once we can manipulate concurrency option to p-map
        // we could make it `Number.MAX_VALUE` here to speed cancellation up
        // <https://github.com/sindresorhus/p-map/issues/28>
        //
        if (message === 'cancel') isCancelled = true;
    });
}


function timeToExecute(dueDate, now) {
    const thresholdMinutes = 5
    const bufferInRangeMs = 5000; // add buffer so ${duaDate} and ${now} don't need to overlap perfectly
    const timeDiff = Math.abs(now.getTime() - dueDate.getTime())

    return timeDiff <= bufferInRangeMs ||
        // add a buffer of ${thresholdMinutes} after ${dueDate} in which the action is still executed
        (now.getTime() >= dueDate.getTime() && timeDiff < (thresholdMinutes * 60 * 1000))
}

(async () => {
    let jobError = null;
    try {
        const usersToAutomate = await db.getUsers();
        console.log(`got ${usersToAutomate.length} users`)

        let actionPromises = [];
        console.log("time: " + new Date().toUTCString())

        for (const user of usersToAutomate) {

            console.log('processing user: ' + user.email)
            console.log(JSON.stringify(user))
            const { abbrevToDayOfWeek, dayOfWeekToAbbrv } = require('../util')
            const now = new Date()

            const dailyConfig = await db.getDailyConfig(user.username, now)
            let selectedConfig = dailyConfig;

            if (dailyConfig) {
                if (dailyConfig.automation_type === WORKDAY_CONFIG_AUTOMATION_TYPE.NO_AUTOMATE) {
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
                    console.log(`[AUTOMATION]: ${dailyConfig}`);
                }
            } else {
                selectedConfig = await db.getWeeklyConfig(user.username, now)
            }

            if (selectedConfig === null) {
                console.log(`User ${user.username}. No configurations found`)
                continue;
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

            if (action && dueDate) {

                if (await db.shouldExecute(user.username, action, dueDate)) {
                    if (await db.checkForExecutionFailure(user.username, action, dueDate)) {
                        // TOOD: notify user if not already

                    } else {
                        console.log(`Executing action ${action} for user ${user.username}.\nworkday: ${JSON.stringify(selectedConfig)}`)
                        actionPromises.push(
                            new Promise((resolve, reject) => {
                                executeAction(user.username, user.password, action)
                                    .then(result => {
                                        resolve({
                                            user: user,
                                            action: action,
                                            workdayConfig: selectedConfig,
                                            result
                                        })
                                    })
                                    .catch(err => {
                                        reject({
                                            user: user,
                                            action: action,
                                            workdayConfig: selectedConfig,
                                            err
                                        })
                                    })
                            }))
                    }
                }
                else {
                    console.log(`NOT executing action ${action} for user ${user.username}.\nworkday: ${JSON.stringify(selectedConfig)}`)
                }
            } else {
                console.log("waiting...")
            }
        }

        const actionResults = await Promise.allSettled(actionPromises)

        for (const actionResult of actionResults) {
            const successful = actionResult.status === 'fulfilled'
            const curUser = successful ? actionResult.value.user : actionResult.reason.user;

            console.info(`[AUTOMATION]: saving job results...: ${JSON.stringify(actionResult)}`)

            let logEntryStatus, logEntryErr, logEntryMsg, logEntryAction = null
            try {
                if (actionResult.status === 'fulfilled') {
                    logEntryStatus = LOG_ENTRY_STATUS.SUCCESSFUL;
                    logEntryMsg = actionResult.value.result
                    logEntryAction = actionResult.value.action
                } else if (actionResult.reason.err instanceof MDDSZApiError) {
                    logEntryStatus = LOG_ENTRY_STATUS.SUCCESSFUL;
                    logEntryMsg = `${actionResult.reason.err.message} (${actionResult.reason.err.failureReason})`
                    logEntryAction = actionResult.reason.action
                } else {
                    logEntryErr = actionResult.reason.err.toString()
                    logEntryStatus = LOG_ENTRY_STATUS.FAILED;
                    logEntryAction = actionResult.reason.action
                }

                // log job execution
                await db.addLogEntry(curUser.login_info_id, logEntryStatus, new Date(), logEntryErr, logEntryMsg, logEntryAction)
            } catch (error) {
                console.log('[AUTOMATION]: Error adding log entry');
                console.log(error)
                throw error;
            }
        }
    } catch (err) {
        console.error(err)
        jobError = err.toString()
    }
    // signal to parent that the job is done
    if (parentPort) {
        parentPort.postMessage(jobError ?? 'done');
        if (jobError) {
            exit(1)
        }
    } else process.exit(0);
})();
