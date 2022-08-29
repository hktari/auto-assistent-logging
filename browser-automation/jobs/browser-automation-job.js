const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig, CONFIG_TYPE } = require('../interface')
const db = require('../dbFacade')
const { executeAction, MDDSZApiError } = require('../mddsz-api');

const logger = require('../util/logging')
const { parentPort } = require('worker_threads');
const { exit } = require('process');
const { getActionsForDate, AutomationActionResult } = require('../util/actions');
const { handleAutomationForUser } = require('../auto-assistant');

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


(async () => {
    let jobError = null;
    try {
        logger.info(`${'-'.repeat(50)}`)
        logger.info('start')

        const usersToAutomate = await db.getUsers();
        logger.info(`got ${usersToAutomate.length} users`)

        const curTime = new Date();
        logger.info("time: " + curTime.toUTCString())


        const automationActionsList = []
        for (const user of usersToAutomate) {
            const automationActionsForUser = handleAutomationForUser(user, curTime)
            if (automationActionsForUser.length === 0) {
                logger.debug(`User ${user.username}. No configurations found`)
            } else {
                automationActionsList.push(automationActionsForUser)
            }
        }

        // todo: map PromiseSettledResult to AutomationActionResult 

        const actionResults = await Promise.allSettled(automationActionsList)

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
