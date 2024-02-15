if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  require("dotenv").config();
}

const {
  AutomationError,
  delay,
  ExecuteFailureReason,
} = require("./common");
const { AUTOMATE_ACTION, LogEntry } = require("../interface");
const logger = require("../util/logging");

/**
 *  * E-racuni User Configuration
 * @typedef {{itsClientId: string, itcSIDhomepage: string, appHomepageURL: string, appLoggedInURL: string}} ERacuniUserConfiguration
 */

/**
 * @param {AUTOMATE_ACTION} action
 * @param {ERacuniUserConfiguration} userConfiguration
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<string>}
 */
async function executeAction(action, userConfiguration, browser) {
  logger.debug("endpoint: " + userConfiguration.appHomepageURL);
  logger.debug("Executing action: " + action);

  const VALID_ACTION = Object.entries(AUTOMATE_ACTION)
    .map((val) => val[1])
    .includes(action);

  if (!VALID_ACTION) {
    throw new Error(`Unhandled type of action ${action}`);
  }
  if (!browser) {
    throw new Error("browser is undefined");
  }


  if (!isUserConfigurationValid(userConfiguration)) {
    throw new AutomationError(
      action,
      ExecuteFailureReason.InvalidConfiguration,
      `Invalid user configuration: \n${JSON.stringify(userConfiguration)}`
    );
  }

  try {
    const page = await browser.newPage();

    page.setDefaultTimeout(10000);

    await page.goto(userConfiguration.appHomepageURL);

    // handle geolocation popup request
    // https://github.com/puppeteer/puppeteer/issues/846
    await page.evaluateOnNewDocument(function () {
      navigator.geolocation.getCurrentPosition = function (cb) {
        setTimeout(() => {
          cb({
            coords: {
              accuracy: 21,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              latitude: 46.4416995,
              longitude: 15.1957154,
              speed: null,
            },
          });
        }, 1000);
      };
    });

    const { itsClientId, itcSIDhomepage } = userConfiguration;

    const cookies = [
      {
        name: "ItcClientID",
        value: itsClientId,
      },
      {
        name: "ItcSIDhomepage",
        value: itcSIDhomepage,
      },
    ];

    await page.setCookie(...cookies);

    await page.goto(userConfiguration.appLoggedInURL);

    const startBtnSelector = "a.clockin-button.er-button-green";
    const stopBtnSelector = "a.clockin-button.er-button-red";

    const btnSelector =
      action === AUTOMATE_ACTION.START_BTN ? startBtnSelector : stopBtnSelector;

    const btn = await page.waitForSelector(btnSelector);

    // make sure start button is enabled
    const buttonDisabled = await page.$eval(btnSelector, (btn) => btn.disabled);

    if (buttonDisabled) {
      throw new AutomationError(
        action,
        ExecuteFailureReason.ButtonDisabled,
        `Can't click button: ${btnSelector}. \nDisabled`
      );
    }

    await btn.click();

    logger.debug("clicking...");

    const successTextIndicator =
      action === AUTOMATE_ACTION.START_BTN ? "na delu" : "odsoten";

    await page.waitForFunction(
      `document.querySelector('body').innerText.toLowerCase().includes("${successTextIndicator}")`,
      { timeout: 7500 }
    );

    await delay(3000);

    return "Finished successfully !";
  } catch (error) {
    logger.error(error.toString());
    throw error;
  }
}

/**
 *
 * @param {ERacuniUserConfiguration} userConfiguration
 */
function isUserConfigurationValid({
  itsClientId,
  itcSIDhomepage,
  appHomepageURL,
  appLoggedInURL,
}) {
  if (!itsClientId?.length || !itcSIDhomepage?.length) {
    return false;
  }

  try {
    new URL(appHomepageURL);
    new URL(appLoggedInURL);
  } catch (error) {
    return false;
  }

  return true;
}

module.exports = {
  executeAction,
};
