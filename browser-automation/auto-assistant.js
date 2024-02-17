const {
  executeAction: executeActionERacuni,
} = require("./automation/e-racuni");
const { executeAction } = require("./automation/mddsz-api");
const logger = require("./util/logging");
const {
  getActionsForDate,
  AutomationActionResult,
  ERacuniAutomationActionResult,
  AutomationAction,
} = require("./util/actions");
const {
  AUTOMATE_ACTION,
  WORKDAY_CONFIG_AUTOMATION_TYPE,
  LOG_ENTRY_STATUS,
  WorkdayConfig,
  CONFIG_TYPE,
  LogEntry,
  AUTOMATION_TYPE,
} = require("./interface");

const db = require("./dbFacade");

// Filter out exceptions made for weekly configuration
function _filterThroughExceptions(actionsList, exceptions) {
  return actionsList.filter((action) => {
    return (
      action.configType === CONFIG_TYPE.DAILY ||
      (action.configType === CONFIG_TYPE.WEEKLY &&
        !exceptions.some((ex) => ex.action === action.actionType))
    );
  });
}

function _isSameDay(datetimeFirst, datetimeSecond) {
  return (
    datetimeFirst.toISOString().substring(0, 10) ==
    datetimeSecond.toISOString().substring(0, 10)
  );
}

function _datetimeRangeCompare(datetimeFirst, datetimeSecond, rangeMs = 60000) {
  logger.debug(
    `comparing  ${datetimeFirst.toUTCString()} : ${datetimeSecond.toUTCString()} `
  );

  return (
    Math.abs(datetimeFirst.getTime() - datetimeSecond.getTime()) <= rangeMs
  );
}

/**
 * filters the @param actionsList based on whether there is a successful entry inside @param logEntries
 * @param {AutomationAction[]} actionsList
 * @param {LogEntry[]} logEntries
 * @param {AUTOMATION_TYPE} endpoint
 * @returns
 */
function _filterOutAlreadyExecuted(actionsList, logEntries, endpoint) {
  return actionsList.filter((action) => {
    const logEntryMatchesAction = logEntries.some((le) => {
      return (
        le.action === action.actionType &&
        action.configType === le.configType &&
        endpoint === le.automationType &&
        _isSameDay(action.dueAt, le.timestamp) &&
        le.status === LOG_ENTRY_STATUS.SUCCESSFUL
      );
    });
    return !logEntryMatchesAction;
  });
}

async function _getAndFilterActionsForDate(user, datetime) {
  logger.debug("processing for datetime: " + datetime.toUTCString());
  let actionsForDate = await getActionsForDate(user, datetime);

  const workweekExceptions = await db.getWorkweekExceptions(
    user.username,
    datetime
  );
  logger.debug("filtering out actions with weekly exceptions");
  actionsForDate = _filterThroughExceptions(actionsForDate, workweekExceptions);
  logger.debug(actionsForDate.length + " left");

  return actionsForDate;
}

function _sortByDatetimeAsc(actions) {
  let tmp = [...actions];
  return tmp.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}

/**
 * Checks the database for any pending automation actions for the given user and time.
 *
 * @param {import('./dbFacade').User} user
 * @param {Date} datetime the current time
 * @param {AUTOMATION_TYPE} endpoint
 * @returns {Promise<AutomationAction | null>}
 */
async function _getPendingAutomationAction(user, datetime, endpoint) {
  let actionsPlannedToday = await _getAndFilterActionsForDate(user, datetime);

  // handle overnight work shifts
  // the roots of the issues lies in the design of the daily / weekly config objects.
  // the 'date' field is bound to the start of the work shift, so in order to fetch the end, one has to pass the day before
  if (datetime.getUTCHours() <= 8) {
    const yesterday = new Date(datetime);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    actionsPlannedToday = actionsPlannedToday.concat(
      await _getAndFilterActionsForDate(user, yesterday)
    );
  }

  let logEntriesToday = await db.getLogEntries(user.username, datetime);
  logger.debug("filtering out already executed actions");
  actionsPlannedToday = _filterOutAlreadyExecuted(
    actionsPlannedToday,
    logEntriesToday,
    endpoint
  );
  logger.debug(actionsPlannedToday.length + " left");

  // sort by datetime
  actionsPlannedToday = _sortByDatetimeAsc(actionsPlannedToday);

  // TODO: when start_btn is failing (in the case when user has clicked it manually), it should not prevent stop_btn execution

  for (const action of actionsPlannedToday) {
    logger.debug("considering executing " + action + " ...");

    if (!action.timeToExecute(datetime)) {
      logger.debug('not yet')
      continue;
    }
    
    logger.debug("ok");

    // take the first action to be executed
    return action;
  }

  return null;
}

/**
 *
 * @param {*} user
 * @param {*} action
 * @param {*} browser
 * @returns {Promise<AutomationActionResult>}
 */
async function _executeMDDSZAutomation(user, action, browser) {
  try {
    const mddszResultMsg = await executeAction(
      user.username,
      user.password,
      action.actionType,
      browser
    );
    return new AutomationActionResult(
      user,
      action.actionType,
      action.configType,
      AUTOMATION_TYPE.MDDSZ,
      action.dueAt,
      mddszResultMsg,
      null
    );
  } catch (err) {
    logger.error(err.stack);

    return new AutomationActionResult(
      user,
      action.actionType,
      action.configType,
      AUTOMATION_TYPE.MDDSZ,
      action.dueAt,
      null,
      err
    );
  }
}

/**
 *
 * @param {*} user
 * @param {*} action
 * @param {import("./automation/e-racuni").ERacuniUserConfiguration} eracuniConfig
 * @param {*} browser
 * @returns {Promise<AutomationActionResult>}
 */
async function _executeEracuniAutomation(user, action, eracuniConfig, browser) {
  try {
    const eracuniResultMsg = await executeActionERacuni(
      action.actionType,
      eracuniConfig,
      browser
    );
    return new AutomationActionResult(
      eracuniConfig,
      user,
      action.actionType,
      action.configType,
      action.dueAt,
      eracuniResultMsg,
      null
    );
  } catch (err) {
    logger.error(err.stack);
    return new AutomationActionResult(
      eracuniConfig,
      user,
      action.actionType,
      action.configType,
      action.dueAt,
      null,
      err
    );
  }
}

/**
 *
 * @param {import("./dbFacade").User} user
 * @param {AUTOMATION_TYPE} endpoint
 * @returns {Promise<boolean>}
 */
async function _isAutomationEnabledForEndpoint(user, endpoint) {
  switch (endpoint) {
    case AUTOMATION_TYPE.MDDSZ:
      return true;
    case AUTOMATION_TYPE.ERACUNI:
      const eracuniConfig = await db.getEracuniConfigurationBy(user.accountId);
      return !!eracuniConfig;
    default:
      throw new Error("unhandled case");
  }
}

/**
 *
 * @param {import('./dbFacade').User} user
 * @param {Date} datetime the current time
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<AutomationActionResult[]>}
 */
async function handleAutomationForUser(user, datetime, browser) {
  const results = [];

  // if MDDSZ automation is enabled
  if (_isAutomationEnabledForEndpoint(user, AUTOMATION_TYPE.MDDSZ)) {
    const mddszAutomation = await _getPendingAutomationAction(
      user,
      datetime,
      AUTOMATION_TYPE.MDDSZ
    );
    results.push(_executeMDDSZAutomation(user, mddszAutomation, browser));
  }

  if (_isAutomationEnabledForEndpoint(user, AUTOMATION_TYPE.ERACUNI)) {
    logger.debug("fetching eracuni configuration...");
    const eracuniConfig = await db.getEracuniConfigurationBy(user.accountId);
    logger.debug(`found ${!!eracuniConfig ? "one" : "none"} `);
    logger.debug("handling automation for ERacuni as well");

    const eracuniAutomation = await _getPendingAutomationAction(
      user,
      datetime,
      AUTOMATION_TYPE.ERACUNI
    );
    results.push(_executeEracuniAutomation(user, eracuniAutomation, browser));
  }

  return results;
}

/**
 * Adds entries into the log_entry table
 * @param {AutomationActionResult} automationResult
 */
async function logAutomationResult(automationResult) {
  let logEntryStatus = null;

  if (!automationResult.error) {
    logEntryStatus = LOG_ENTRY_STATUS.SUCCESSFUL;
  } else {
    logEntryStatus = LOG_ENTRY_STATUS.FAILED;
  }

  logger.debug("adding log entry...");
  return db.addLogEntry(
    automationResult.user.login_info_id,
    logEntryStatus,
    automationResult.dueAt,
    automationResult.error?.toString(),
    automationResult.message,
    automationResult.actionType,
    automationResult.configType,
    automationResult.automationType
  );
}

module.exports = {
  handleAutomationForUser,
  logAutomationResult,
  _sortByDatetimeAsc,
  _isSameDay,
  _filterOutAlreadyExecuted,
};
