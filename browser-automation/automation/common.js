if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  require("dotenv").config();
}

const puppeteer = require("puppeteer");

function delay(waitTime) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, waitTime);
  });
}

function createBrowser(debug) {
  if (debug) {
    return puppeteer.launch({
      // devtools: true
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      slowMo: 50,
    });
  } else {
    return puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      slowMo: 0,
    });
  }
}

const ExecuteFailureReason = Object.freeze({
  ButtonDisabled: "ButtonDisabled",
  ButtonNotFound: "ButtonNotFound",
  InvalidConfiguration: "InvalidConfiguration"
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
  ExecuteFailureReason,
  AutomationError,
};
