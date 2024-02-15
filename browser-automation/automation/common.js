if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  require("dotenv").config();
}
function delay(waitTime) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, waitTime);
  });
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
  ExecuteFailureReason,
  AutomationError,
};
