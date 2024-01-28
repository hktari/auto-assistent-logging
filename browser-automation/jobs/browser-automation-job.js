const db = require("../dbFacade");
const logger = require("../util/logging");
const { parentPort } = require("worker_threads");
const {
  handleAutomationForUser,
  logAutomationResult,
} = require("../auto-assistant");

// store boolean if the job is cancelled
let isCancelled = false;

const flushLogs = () =>
  new Promise((resolve, reject) => {
    logger.end();
    logger.once("finish", () => resolve());
  });

// The unhandledRejection listener
process.on("unhandledRejection", (error) => {
  console.log("unhandledRejection", error);
  process.exit(1);
});

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

    for (const result of automationResults) {
      try {
        await logAutomationResult(result);
      } catch (err) {
        logger.error("Error occured when adding log entry");
        logger.error(err.stack);
      }
    }
  } catch (err) {
    logger.error(err.stack);
  }

  await flushLogs();

  if (parentPort) parentPort.postMessage("done");
  else process.exit(0);
})();
