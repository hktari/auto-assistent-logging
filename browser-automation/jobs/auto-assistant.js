const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig } = require('../interface')
const db = require('../dbFacade')
const { executeAction, MDDSZApiError } = require('../mddsz-api');

const logger = require('../util/logging')
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
        logger.info(`${'-'.repeat(50)}`)
        logger.info('start')
        const usersToAutomate = await db.getUsers();
        logger.info(`got ${usersToAutomate.length} users`)

        let actionPromises = [];
        logger.info("time: " + new Date().toUTCString())

        for (const user of usersToAutomate) {

            logger.info('\n' + '*'.repeat(50))
            logger.debug('processing user: ' + user.email)
            logger.debug(JSON.stringify(user))
            const now = new Date()

            logger.debug('retrieving daily config...')
            const dailyConfig = await db.getDailyConfig(user.username, now)
            let selectedConfig = dailyConfig;

            if (dailyConfig) {
                if (dailyConfig.automation_type === WORKDAY_CONFIG_AUTOMATION_TYPE.NO_AUTOMATE) {
                    logger.debug(`user ${user.username} requested no automation for date: ${dailyConfig.date}`)
                    actionPromises.push(new Promise((res, rej) => {
                        res({
                            user: user,
                            workdayConfig: selectedConfig,
                            action: WORKDAY_CONFIG_AUTOMATION_TYPE.NO_AUTOMATE,
                            result: 'Skipping automation as requested'
                        })
                    }))
                    continue;
                } else {
                    logger.debug(`found ${dailyConfig}`)
                }
            } else {
                logger.debug('retrieving weekly config...')
                selectedConfig = await db.getWeeklyConfig(user.username, now)
            }

            if (selectedConfig === null) {
                logger.debug(`User ${user.username}. No configurations found`)
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
                logger.debug('considering executing ' + action + ' ...')

                if (await db.shouldExecute(user.username, action, dueDate)) {
                    if (await db.checkForExecutionFailure(user.username, action, dueDate)) {
                        // TOOD: notify user if not already

                    } else {
                        logger.debug(`Executing action ${action} for user ${user.username}.\n${selectedConfig}`)
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
                    logger.debug(`NOT executing action ${action} for user ${user.username}.\nworkday: ${JSON.stringify(selectedConfig)}`)
                }
            } else {
                logger.debug("waiting...")
            }
        }

        const actionResults = await Promise.allSettled(actionPromises)

        for (const actionResult of actionResults) {
            const successful = actionResult.status === 'fulfilled'
            const curUser = successful ? actionResult.value.user : actionResult.reason.user;

            logger.info(`processing job result: ${JSON.stringify(actionResult)}`)

            let logEntryStatus, logEntryErr, logEntryMsg, logEntryAction = null
            const timestamp = new Date()
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

                if (logEntryAction === WORKDAY_CONFIG_AUTOMATION_TYPE.NO_AUTOMATE &&
                    db.anyLogEntryOfType(curUser.login_info_id, logEntryStatus, logEntryAction, timestamp)) {
                    // make sure to add only one log entry of type 'no_automate'
                    logger.debug('already added "no_automate" entry for today')
                    continue;
                }

                logger.debug('adding log entry...')
                await db.addLogEntry(curUser.login_info_id, logEntryStatus, timestamp, logEntryErr, logEntryMsg, logEntryAction)
            } catch (error) {
                logger.error('Error adding log entry')
                logger.error(error)
                throw error;
            }
        }
    } catch (err) {
        console.error(err)
        jobError = err.toString()
    }
    // signal to parent that the job is done
    if (parentPort) {
        logger.debug('end')
        parentPort.postMessage(jobError ?? 'done');
        if (jobError) {
            exit(1)
        }
    } else process.exit(0);
})();
