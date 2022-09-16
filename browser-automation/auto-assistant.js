const { executeAction, MDDSZApiError } = require('./mddsz-api');
const logger = require('./util/logging')
const { getActionsForDate, AutomationActionResult } = require('./util/actions');
const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig, CONFIG_TYPE } = require('./interface')

const db = require('./dbFacade')

// Filter out exceptions made for weekly configuration
function _filterThroughExceptions(actionsList, exceptions) {
    return actionsList.filter(action => {
        return action.configType === CONFIG_TYPE.DAILY
            || (action.configType === CONFIG_TYPE.WEEKLY && !exceptions.some(ex => ex.action === action.actionType))
    })
}

function _datetimeRangeCompare(datetimeFirst, datetimeSecond, rangeMs = 60000) {
    logger.debug(`comparing  ${datetimeFirst.toUTCString()} : ${datetimeSecond.toUTCString()} `)
    return Math.abs(datetimeFirst.getTime() - datetimeSecond.getTime()) <= rangeMs
}

/**
 * filters the @param actionsList based on whether there is an entry inside @param logEntries
 * @param {AutomationAction[]} actionsList 
 * @param {LogEntry[]} logEntries 
 * @returns 
 */
function _filterOutAlreadyExecuted(actionsList, logEntries) {
    return actionsList.filter(action => {
        return !logEntries.some(le => {
            return le.action === action.actionType && action.configType === le.configType && _datetimeRangeCompare(action.dueAt, le.timestamp)
        })
    })
}


async function _getAndFilterActionsForDate(user, datetime) {
    logger.debug('processing for datetime: ' + datetime.toUTCString())
    let actionsForDate = await getActionsForDate(user, datetime)

    const workweekExceptions = await db.getWorkweekExceptions(user.username, datetime)
    logger.debug('filtering out actions with weekly exceptions');
    actionsForDate = _filterThroughExceptions(actionsForDate, workweekExceptions)
    logger.debug(actionsForDate.length + ' left')

    return actionsForDate
}

/**
 * Checks the database for any pending automation actions for the given user and time.
 * @param {User} user the user object
 * @param {Date} datetime the current time
 * @returns {Promise<AutomationActionResult>[]}
 */
async function handleAutomationForUser(user, datetime) {
    logger.debug('\n' + '*'.repeat(50))
    logger.debug('processing user: ' + user.email)

    let actionsPlannedToday = await _getAndFilterActionsForDate(user, datetime)

    if (datetime.getUTCHours() <= 8) {
        const yesterday = new Date(datetime)
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)
        actionsPlannedToday = actionsPlannedToday.concat(await _getAndFilterActionsForDate(user, yesterday))
    }


    let logEntriesToday = await db.getLogEntries(user.username, datetime)
    logger.debug('filtering out already executed actions');
    actionsPlannedToday = _filterOutAlreadyExecuted(actionsPlannedToday, logEntriesToday);
    logger.debug(actionsPlannedToday.length + ' left')


    let actionPromises = [];
    for (const action of actionsPlannedToday) {
        logger.debug('considering executing ' + action + ' ...')
        if (action.timeToExecute(datetime)) {
            logger.debug('ok')
            actionPromises.push(
                new Promise((resolve, reject) => {
                    executeAction(user.username, user.password, action.actionType)
                        .then(result => {
                            resolve(new AutomationActionResult(action.user, action.actionType, action.configType, action.dueAt, result, null))
                        })
                        .catch(err => {
                            reject(new AutomationActionResult(action, null, err))
                        })
                }))
        }
    }

    const actionResults = await Promise.allSettled(actionPromises)

    // extract AutomationActionResult
    return actionResults.map(result => result.status === 'fulfilled' ? result.value : result.reason)
}

/**
 * Adds entries into the log_entry table
 * @param {AutomationActionResult} automationResult 
 */
async function logAutomationResult(automationResult) {
    let logEntryStatus = null;

    if (!automationResult.error) {
        logEntryStatus = LOG_ENTRY_STATUS.SUCCESSFUL;
    } else if (automationResult.error instanceof MDDSZApiError) {
        logEntryStatus = LOG_ENTRY_STATUS.SUCCESSFUL;
    } else {
        logEntryStatus = LOG_ENTRY_STATUS.FAILED;
    }

    logger.debug('adding log entry...')
    return db.addLogEntry(
        automationResult.user.login_info_id,
        logEntryStatus,
        automationResult.dueAt,
        automationResult.error?.toString(),
        automationResult.message,
        automationResult.actionType,
        automationResult.configType)
}


module.exports = {
    handleAutomationForUser,
    logAutomationResult,
    _filterOutAlreadyExecuted
}