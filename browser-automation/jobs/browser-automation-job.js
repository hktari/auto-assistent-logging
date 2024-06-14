const db = require("../dbFacade");
const logger = require("../util/logging");
const { parentPort } = require("worker_threads");
const {
  handleAutomationForUser,
  logAutomationResult,
} = require("../auto-assistant");
const puppeteer = require("puppeteer-extra");


// add recaptcha plugin and provide it your 2captcha token (= their apiKey)
// 2captcha is the builtin solution provider but others would work as well.
// Please note: You need to add funds to your 2captcha account for this to work
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_API_KEY // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
  })
)

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
  let browser = null;
  try {
    logger.info(`${"-".repeat(50)}`);
    logger.info("start");
    const curTime = new Date();
    logger.info("time: " + curTime.toUTCString());

    let browserConfig;

    if (process.env.NODE_ENV === "development") {
      browserConfig = {
        // devtools: true
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        slowMo: 50,
      };
    } else {
      browserConfig = {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        slowMo: 0,
      };
    }
    logger.debug("creating browser...");
    browser = await puppeteer.launch(browserConfig);

    const usersToAutomate = await db.getUsers();
    logger.info(`got ${usersToAutomate.length} users`);

    let automationResults = [];
    for (const user of usersToAutomate) {
      const userAutomationResults = await handleAutomationForUser(
        user,
        curTime,
        browser
      );
      logger.info(
        `User ${user.username}. ${
          userAutomationResults.length > 0
            ? userAutomationResults.length + " automations performed"
            : "Nothing to do..."
        }`
      );

      automationResults = automationResults.concat(userAutomationResults);
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
  } finally {
    if (browser) {
      logger.debug("closing browser...");
      await browser.close();
    }
  }

  await flushLogs();

  if (parentPort) parentPort.postMessage("done");
  else process.exit(0);
})();
