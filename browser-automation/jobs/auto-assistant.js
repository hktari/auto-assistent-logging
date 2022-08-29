const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig, CONFIG_TYPE } = require('../interface')
const db = require('../dbFacade')
const { executeAction, MDDSZApiError } = require('../mddsz-api');

const logger = require('../util/logging')
const { parentPort } = require('worker_threads');
const { exit } = require('process');
const { getActionsForDate } = require('../util/actions');

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



// Filter out exceptions made for weekly configuration
function filterThroughExceptions(actionsList, exceptions) {
    return actionsList.filter(action => {
        return action.configType === CONFIG_TYPE.DAILY
            || (action.configType === CONFIG_TYPE.WEEKLY && !exceptions.some(ex => ex.action === action.actionType))
    })
}

function filterOutAlreadyExecuted(actionsList, logEntries) {
    return actionsList.filter(action => {
        return logEntries.some(le => {
            return le.action === action.actionType && action.configType === le.configType
        })
    })
}

/**
 * Checks the database for any pending automation actions for the given user and time.
 * @param {User} user the user object
 * @param {Date} time the current time
 * @returns {Promise<AutomationAction>[]}
 */
function handleAutomationForUser(user, time) {

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

            // todo: move this code into a function

            logger.info('\n' + '*'.repeat(50))
            logger.debug('processing user: ' + user.email)
            logger.debug(JSON.stringify(user))
            const now = new Date()

            let actionsPlannedToday = await getActionsForDate(user.username, now)

            const workweekExceptions = await db.getWorkweekExceptions(user.username, date)
            logger.debug('filtering out actions with weekly exceptions');
            actionsPlannedToday = filterThroughExceptions(actionsPlannedToday, workweekExceptions)

            const logEntriesToday = await db.getLogEntries(user.username, date)
            logger.debug('filtering out already executed actions');
            actionsPlannedToday = filterOutAlreadyExecuted(actionsPlannedToday, logEntriesToday);

            if (selectedConfig === null) {
                logger.debug(`User ${user.username}. No configurations found`)
                continue;
            }

            for (const action of actionsPlannedToday) {

                logger.debug('considering executing ' + action + ' ...')
                if (action.timeToExecute(now)) {
                    actionPromises.push(
                        new Promise((resolve, reject) => {
                            executeAction(user.username, user.password, action.actionType)
                                .then(result => {
                                    resolve({
                                        user: user,
                                        action: action,
                                        result
                                    })
                                })
                                .catch(err => {
                                    reject({
                                        user: user,
                                        action: action,
                                        err
                                    })
                                })
                        }))
                }
            }
        }

        // todo: map PromiseSettledResult to AutomationActionResult 

        const actionResults = await Promise.allSettled(actionPromises)

        for (const actionResult of actionResults) {
            const successful = actionResult.status === 'fulfilled'
            const curUser = successful ? actionResult.value.user : actionResult.reason.user;

            logger.info(`processing job result`)
            logger.debug(JSON.stringify(actionResult))

            let logEntryStatus, logEntryErr, logEntryMsg, logEntryAction = null
            const timestamp = new Date()
            try {
                if (actionResult.status === 'fulfilled') {
                    logEntryStatus = LOG_ENTRY_STATUS.SUCCESSFUL;
                    logEntryMsg = actionResult.value.result
                    logEntryAction = actionResult.value.action.actionType
                } else if (actionResult.reason.err instanceof MDDSZApiError) {
                    logEntryStatus = LOG_ENTRY_STATUS.SUCCESSFUL;
                    logEntryMsg = `${actionResult.reason.err.message} (${actionResult.reason.err.failureReason})`
                    logEntryAction = actionResult.reason.action.actionType
                } else {
                    logEntryErr = actionResult.reason.err.toString()
                    logEntryStatus = LOG_ENTRY_STATUS.FAILED;
                    logEntryAction = actionResult.reason.action.actionType
                }

                logger.debug('adding log entry...')
                await db.addLogEntry(curUser.login_info_id, logEntryStatus, timestamp, logEntryErr, logEntryMsg, logEntryAction)
            } catch (error) {
                logger.error('Error adding log entry')
                logger.error(error)
                jobError = 'Error occured. Please check the log'
            }
        }
    } catch (err) {
        logger.error(err)
        jobError = 'Error occured. Please check the log'
    }
    // signal to parent that the job is done
    if (parentPort) {
        logger.debug('end')
        parentPort.postMessage(jobError ?? 'done');
        if (jobError) {
            exit(1)
        }
    } else {
        process.exit(0);
    }
})();
