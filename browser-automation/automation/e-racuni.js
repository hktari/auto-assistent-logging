if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  require("dotenv").config();
}

const { createBrowser } = require("./common");
const { AUTOMATE_ACTION, LogEntry } = require("../interface");
const logger = require("../util/logging");

async function executeAction(itsClientId, endpoint, action) {
  logger.debug("endpoint: " + endpoint);
  logger.debug("Executing action: " + action);
  logger.debug("ENV: " + process.env.NODE_ENV);

  const VALID_ACTION = Object.entries(AUTOMATE_ACTION)
    .map((val) => val[1])
    .includes(action);

  if (!VALID_ACTION) {
    throw new Error(`Unhandled type of action ${action}`);
  }

  const browser = await createBrowser(process.env.NODE_ENV === "development");

  try {
    const page = await browser.newPage();

    page.setDefaultTimeout(1000);

    const homePage = "https://e-racuni.com/S8a"
    await page.goto(homePage);
    
    // TODO: refactor
    itsClientId = "IflQSpp3KaK00Cwf095MyYnQ_3881595479"
    
    const cookies = [
      {
        name: "ItcClientID",
        value: itsClientId,
      },
      {
        name: "ItcSIDhomepage",
        value: "xtgrLk3eekf9Sptlltb0flYS_3883195249",
      },
    ];

    await page.setCookie(...cookies);

    await page.goto("https://e-racuni.com/S8a/Clockin-CA74538906CA0D009684938F0815D96F")
    await page.waitForNavigation(); // The promise resolves after navigation has finished

    // const startBtnSelector = "#btn_zacni";
    // const stopBtnSelector = "#btn_koncaj";

    // const btnSelector =
    //   action === AUTOMATE_ACTION.START_BTN ? startBtnSelector : stopBtnSelector;
    // logger.debug("waiting for button...");
    // const btn = await page.waitForSelector(btnSelector);

    // await delay(3000);

    // // make sure start button is enabled
    // const buttonDisabled = await page.$eval(btnSelector, (btn) => btn.disabled);

    // if (buttonDisabled) {
    //   throw new MDDSZApiError(
    //     action,
    //     ExecuteFailureReason.ButtonDisabled,
    //     `Can't click button: ${btnSelector}. \nDisabled`
    //   );
    // }

    // await btn.click();
    // logger.debug("clicking...");

    // // h2 Zapis uspešno dodan.
    // const successBannerSelector = "#t_Alert_Success";
    // await page.waitForSelector(successBannerSelector, { visible: true });
    // logger.debug("waiting for success banner...");

    // await delay(5000);
    await browser.close();
    return "Finished successfully !";
  } catch (error) {
    logger.error(error.toString());
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = {
  executeAction,
};
