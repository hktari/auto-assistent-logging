const {
  executeAction: executeActionERacuni,
} = require("./automation/e-racuni");
const { executeAction } = require("./automation/mddsz-api");
const logger = require("./util/logging");
const {
  getActionsForDate,
  AutomationActionResult,
  ERacuniAutomationActionResult,
} = require("./util/actions");
const {
  AUTOMATE_ACTION,
  WORKDAY_CONFIG_AUTOMATION_TYPE,
  LOG_ENTRY_STATUS,
  WorkdayConfig,
  CONFIG_TYPE,
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
 * @returns
 */
function _filterOutAlreadyExecuted(actionsList, logEntries) {
  return actionsList.filter((action) => {
    const logEntryMatchesAction = logEntries.some((le) => {
      return (
        le.action === action.actionType &&
        action.configType === le.configType &&
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
 * @returns {Promise<AutomationActionResult[]>} a collection of promises. If the collection is empty, no automation is pending.
 */
async function handleAutomationForUser(user, datetime) {
  logger.debug("\n" + "*".repeat(50));
  logger.debug("processing user: " + user.email);
  logger.debug("accountId: " + user.accountId);

  let actionsPlannedToday = await _getAndFilterActionsForDate(user, datetime);

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
    logEntriesToday
  );
  logger.debug(actionsPlannedToday.length + " left");

  // sort by datetime
  actionsPlannedToday = _sortByDatetimeAsc(actionsPlannedToday);

  logger.debug("fetching eracuni configuration...");
  const eracuniConfig = await db.getEracuniConfigurationBy(user.accountId);
  logger.debug(`found ${!!eracuniConfig ? "one" : "none"} `);

  const automationResults = [];
  // take the first action to be executed
  for (const action of actionsPlannedToday) {
    logger.debug("considering executing " + action + " ...");
    // TODO: early continue
    if (action.timeToExecute(datetime)) {
      logger.debug("ok");
      try {
        const mddszResultMsg = await executeAction(
          user.username,
          user.password,
          action.actionType
        );
        automationResults.push(
          new AutomationActionResult(
            user,
            action.actionType,
            action.configType,
            action.dueAt,
            mddszResultMsg,
            null
          )
        );
      } catch (err) {
        automationResults.push(
          new AutomationActionResult(
            user,
            action.actionType,
            action.configType,
            action.dueAt,
            null,
            err
          )
        );
      }

      if (eracuniConfig) {
        logger.debug("handling automation for ERacuni as well");

        try {
          const eracuniResultMsg = await executeActionERacuni(eracuniConfig);
          automationResults.push(
            new ERacuniAutomationActionResult(
              eracuniConfig,
              user,
              action.actionType,
              action.configType,
              action.dueAt,
              eracuniResultMsg,
              null
            )
          );
        } catch (err) {
          automationResults.push(
            new ERacuniAutomationActionResult(
              eracuniConfig,
              user,
              action.actionType,
              action.configType,
              action.dueAt,
              null,
              err
            )
          );
        }
      }

      break;
    }
  }

  return automationResults;
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
    automationResult.configType
  );
}

module.exports = {
  handleAutomationForUser,
  logAutomationResult,
  _sortByDatetimeAsc,
  _isSameDay,
  _filterOutAlreadyExecuted,
};
