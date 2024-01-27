const db = require("../dbFacade");
const logger = require("../util/logging");
const { parentPort } = require("worker_threads");
const {
  handleAutomationForUser,
  logAutomationResult,
} = require("../auto-assistant");
const { AutomationActionResult } = require("../util/actions");

// store boolean if the job is cancelled
let isCancelled = false;

// handle cancellation (this is a very simple example)
if (parentPort) {
  parentPort.once("message", (message) => {
    //
    // TODO: once we can manipulate concurrency option to p-map
    // we could make it `Number.MAX_VALUE` here to speed cancellation up
    // <https://github.com/sindresorhus/p-map/issues/28>
    //
    if (message === "cancel") isCancelled = true;
  });
}

(async () => {
  let jobError = null;
  try {
    logger.info(`${"-".repeat(50)}`);
    logger.info("start");

    const curTime = new Date();
    logger.info("time: " + curTime.toUTCString());

    const usersToAutomate = await db.getUsers();
    logger.info(`got ${usersToAutomate.length} users`);

    let automationResults = [];
    for (const user of usersToAutomate) {
      // TODO: if exception is thrown inside 'handleAutomationForUser' it will not be logged ?

      // TODO: calling this throws error
      const autoActionsForUser = await handleAutomationForUser(user, curTime);
      logger.info(
        `User ${user.username}. ${
          autoActionsForUser.length > 0
            ? autoActionsForUser.length + " actions executed"
            : "Nothing to do..."
        }`
      );

      automationResults.concat(autoActionsForUser);
    }

    // Promise. allSettled(automationResults)

    for (const result of automationResults) {
      try {
        await logAutomationResult(result);
      } catch (err) {
        jobError = "Error occured when adding log entry: " + err?.toString();
        logger.error(err?.toString());
      }
    }
  } catch (err) {
    console.log('HELLO')
    jobError = "Error occured: " + err?.toString();
    logger.error(err?.toString());
  }

  if (parentPort) {
    parentPort.postMessage(jobError ?? "done");
  }

  logger.info("end");
  logger.end();
  process.exit(jobError ? 1 : 0);
})();
