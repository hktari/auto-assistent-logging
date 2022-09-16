const db = require('../dbFacade')
const logger = require('../util/logging')
const { parentPort } = require('worker_threads');
const { handleAutomationForUser, logAutomationResult } = require('../auto-assistant');

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


        const automationResults = []
        for (const user of usersToAutomate) {
            const automationActionsForUser = await handleAutomationForUser(user, curTime)
            if (automationActionsForUser.length === 0) {
                logger.info(`User ${user.username}. Nothing to do...`)
            } else {
                automationResults = automationResults.concat(automationActionsForUser)
            }
        }

        for (const result of automationResults) {
            try {
                await logAutomationResult(result)
            } catch (err) {
                jobError = 'Error occured when adding log entry: ' + err?.toString()
                logger.error(err?.toString())
            }
        }
    } catch (err) {
        jobError = 'Error occured: ' + err?.toString()
        logger.error(err?.toString())
    }

    logger.info('end')
    logger.end()
    logger.on('finish', () => {
        if (parentPort) {
            parentPort.postMessage(jobError ?? 'done');
            if (jobError) {
                process.exit(1)
            } else {
                process.exit(0)
            }
        } else {
            process.exit(0);
        }
    })
})();
