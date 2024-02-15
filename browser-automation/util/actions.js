const db = require("../dbFacade");
const {
  AUTOMATE_ACTION,
  CONFIG_TYPE,
  AUTOMATION_TYPE,
} = require("../interface");
const logger = require("./logging");
const { getEnvVariableOrDefault } = require("./util");

const THRESHOLD_MINUTES = +getEnvVariableOrDefault(
  process.env.TIME_TO_EXEC_THRESHOLD_MIN,
  60
);

// add buffer so ${duaDate} and ${now} don't need to overlap perfectly
const BUFFER_IN_RANGE_MS = +getEnvVariableOrDefault(
  process.env.TIME_TO_EXEC_BUFFER_MS,
  5000
);

/**
 * @class AutomationAction
 * @constructor
 * @public
 */
class AutomationAction {
  /**
   *
   * @param {import("../dbFacade").User} user
   * @param {AUTOMATE_ACTION} action
   * @param {CONFIG_TYPE} configType
   * @param {Date} dueAt
   * @param {AUTOMATION_TYPE} automationType
   */
  constructor(user, action, configType, dueAt, automationType) {
    this.user = user;
    /**
     * Automation Action type
     * @type {AUTOMATE_ACTION}
     * @public
     */
    this.actionType = action;
    this.configType = configType;
    this.dueAt = dueAt;
    this.automationType = automationType;
  }

  timeToExecute(time) {
    const timeDiff = Math.abs(time.getTime() - this.dueAt.getTime());

    logger.debug(
      `dueAt: ${this.dueAt.toUTCString()}\ttime: ${time.toUTCString()}\ttime diff: ${timeDiff}`
    );
    if (isNaN(THRESHOLD_MINUTES) || isNaN(BUFFER_IN_RANGE_MS)) {
      logger.warn(
        `TIME_TO_EXEC_THRESHOLD_MIN=${THRESHOLD_MINUTES} or TIME_TO_EXEC_BUFFER_MS=${BUFFER_IN_RANGE_MS} is NaN`
      );
    }

    return (
      timeDiff <= BUFFER_IN_RANGE_MS ||
      // add a buffer of ${thresholdMinutes} after ${dueDate} in which the action is still executed
      (time.getTime() >= this.dueAt.getTime() &&
        timeDiff <= THRESHOLD_MINUTES * 60 * 1000)
    );
  }

  toString() {
    return `${this.user.username}\t${this.actionType}\t${
      this.configType
    }\t${this.dueAt.toUTCString()}\t${this.automationType}`;
  }
}

/**
 *
 * @param {import("../dbFacade").User} user
 * @param {Date} date
 * @param {AUTOMATION_TYPE[]} automationTypes
 * @returns
 */
async function getActionsForDate(user, date, automationTypes) {
  const actionsList = [];

  for (const automationType of automationTypes) {
    const dailyConfig = await db.getDailyConfig(user.username, date);
    if (dailyConfig?.startAt) {
      logger.debug("found start action");
      actionsList.push(
        new AutomationAction(
          user,
          AUTOMATE_ACTION.START_BTN,
          CONFIG_TYPE.DAILY,
          dailyConfig.startAt,
          undefined,
          automationType
        )
      );
    }
    if (dailyConfig?.endAt) {
      logger.debug("found stop action");
      actionsList.push(
        new AutomationAction(
          user,
          AUTOMATE_ACTION.STOP_BTN,
          CONFIG_TYPE.DAILY,
          dailyConfig.endAt,
          undefined,
          automationType
        )
      );
    }

    const weeklyConfig = await db.getWeeklyConfig(user.username, date);
    if (weeklyConfig?.startAt) {
      logger.debug("found start action");
      actionsList.push(
        new AutomationAction(
          user,
          AUTOMATE_ACTION.START_BTN,
          CONFIG_TYPE.WEEKLY,
          weeklyConfig.startAt,
          undefined,
          automationType
        )
      );
    }
    if (weeklyConfig?.endAt) {
      logger.debug("found stop action");
      actionsList.push(
        new AutomationAction(
          user,
          AUTOMATE_ACTION.STOP_BTN,
          CONFIG_TYPE.WEEKLY,
          weeklyConfig.endAt,
          undefined,
          automationType
        )
      );
    }
  }

  return actionsList;
}

class AutomationActionResult extends AutomationAction {
  /**
   * @param {getUsers() return} user
   * @param {AUTOMATE_ACTION} action
   * @param {CONFIG_TYPE} configType
   * @param {AUTOMATION_TYPE} automationType
   * @param {Date} dueAt
   * @param {string} message
   * @param {Error} error
   */
  constructor(user, action, configType, automationType, dueAt, message, error) {
    super(user, action, configType, dueAt, automationType);
    this.message = message;
    this.error = error;
  }

  toString() {
    return super.toString() + `\n${this.error?.toString()}`;
  }
}

class ERacuniAutomationActionResult extends AutomationActionResult {
  /**
   * @param {import('../dbFacade').ERacuniUserConfiguration} eracuniConfig
   * @param {import('../dbFacade').User} user
   * @param {AUTOMATE_ACTION} action
   * @param {CONFIG_TYPE} configType
   * @param {Date} dueAt
   * @param {string} message
   * @param {Error} error
   */
  constructor(eracuniConfig, user, action, configType, dueAt, message, error) {
    super(
      user,
      action,
      configType,
      AUTOMATION_TYPE.ERACUNI,
      dueAt,
      message,
      error
    );
    this.eracuniConfig = eracuniConfig;
  }
}

module.exports = {
  AutomationAction,
  AutomationActionResult,
  ERacuniAutomationActionResult,
  getActionsForDate,
  THRESHOLD_MINUTES,
  BUFFER_IN_RANGE_MS,
};
