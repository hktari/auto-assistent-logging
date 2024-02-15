if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  require("dotenv").config();
}

const puppeteer = require("puppeteer");
const browser = null;

function delay(waitTime) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, waitTime);
  });
}

/**
 *
 * @param {boolean} debug
 * @returns {Promise<puppeteer.Browser>} browser
 */
async function createBrowser(debug) {
  if (browser) {
    return browser;
  }

  let browserConfig;

  if (debug) {
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
  browser = puppeteer.launch(browserConfig);
  return browser;
}

/**
 *
 * @returns {Promise<void>}
 */
async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

const ExecuteFailureReason = Object.freeze({
  ButtonDisabled: "ButtonDisabled",
  ButtonNotFound: "ButtonNotFound",
  InvalidConfiguration: "InvalidConfiguration",
});

class AutomationError extends Error {
  constructor(action, failureReason, message) {
    super(message);
    this.action = action;
    this.failureReason = failureReason;
  }

  toString() {
    return `${this.action}:(${this.failureReason})\t${this.message}`;
  }
}

module.exports = {
  delay,
  createBrowser,
  closeBrowser,
  ExecuteFailureReason,
  AutomationError,
};
