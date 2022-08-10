const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig } = require('../interface')
const db = require('../dbFacade')
const { executeAction } = require('../mddsz-api');

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
    const thresholdMinutes = 1
    return Math.abs(dueDate.getTime() - now.getTime()) < thresholdMinutes * 60 * 1000
}

(async () => {
    let jobError = null;
    try {
        const usersToAutomate = await db.getUsers();
        console.log(`got ${usersToAutomate.length} users`)

        let actionPromises = [];

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
                    console.log(`[AUTOMATION]: user ${user.username} daily config for date: ${dailyConfig.date}`);
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
                console.log("it's not yet time")
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
            const curUser = successful ? actionResult.value.user : actionResult.reason.user;

            console.info(`[AUTOMATION]: saving job results...: ${JSON.stringify(actionResult)}`)

            try {
                const logEntryStatus = actionResult.status === 'fulfilled' ? LOG_ENTRY_STATUS.SUCCESSFUL : LOG_ENTRY_STATUS.FAILED;
                const logEntryErr = actionResult.reason?.err?.toString();
                const logEntryMsg = actionResult.value?.result;
                const logEntryAction = successful ? actionResult.value.action : actionResult.reason.action;

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
