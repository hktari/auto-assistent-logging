const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig } = require('../interface')
const db = require('../dbFacade')
const { executeAction } = require('../mddsz-api');

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

    const LOOKUP_INTERVAL = '5 minutes'

    const usersToAutomate = await db.getUsers();

    let actionPromises = [];

    for (const user in usersToAutomate) {

        const { abbrevToDayOfWeek, dayOfWeekToAbbrv } = require('../util')
        const now = new Date()

        const dailyConfig = await db.getDailyConfig(user.username, now)
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
            selectedConfig = await db.getWeeklyConfig(user.username, now)
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

        if (await db.shouldExecute(user.username, action, dueDate)) {
            if (await db.checkForExecutionFailure(user.username, action, dueDate)) {
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
            db.insertLogEntry(curUser.login_info_id, logEntryStatus, now, logEntryErr, logEntryMsg, actionResult.value.action)
        } catch (error) {
            console.log('[AUTOMATION]: Error adding log entry');
            console.log(error)
        }
    }

    // signal to parent that the job is done
    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
})();
