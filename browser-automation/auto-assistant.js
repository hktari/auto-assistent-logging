const { executeAction, MDDSZApiError } = require('./mddsz-api');
const logger = require('./util/logging')
const { getActionsForDate, AutomationActionResult } = require('./util/actions');
const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig, CONFIG_TYPE } = require('./interface')



// Filter out exceptions made for weekly configuration
function _filterThroughExceptions(actionsList, exceptions) {
    return actionsList.filter(action => {
        return action.configType === CONFIG_TYPE.DAILY
            || (action.configType === CONFIG_TYPE.WEEKLY && !exceptions.some(ex => ex.action === action.actionType))
    })
}

function _filterOutAlreadyExecuted(actionsList, logEntries) {
    return actionsList.filter(action => {
        return logEntries.some(le => {
            return le.action === action.actionType && action.configType === le.configType
        })
    })
}

/**
 * Checks the database for any pending automation actions for the given user and time.
 * @param {User} user the user object
 * @param {Date} time the current time
 * @returns {Promise<AutomationActionResult>[]}
 */
function handleAutomationForUser(user, time) {
    logger.info('\n' + '*'.repeat(50))
    logger.debug('processing user: ' + user.email)
    let actionsPlannedToday = await getActionsForDate(user.username, time)

    const workweekExceptions = await db.getWorkweekExceptions(user.username, time)
    logger.debug('filtering out actions with weekly exceptions');
    actionsPlannedToday = _filterThroughExceptions(actionsPlannedToday, workweekExceptions)

    const logEntriesToday = await db.getLogEntries(user.username, time)
    logger.debug('filtering out already executed actions');
    actionsPlannedToday = _filterOutAlreadyExecuted(actionsPlannedToday, logEntriesToday);

    let actionPromises = [];
    for (const action of actionsPlannedToday) {
        logger.debug('considering executing ' + action + ' ...')
        if (action.timeToExecute(time)) {
            actionPromises.push(
                new Promise((resolve, reject) => {
                    executeAction(user.username, user.password, action.actionType)
                        .then(result => {
                            resolve(new AutomationActionResult(action, result, null))
                        })
                        .catch(err => {
                            reject(new AutomationActionResult(action, null, err))
                        })
                }))
        }
    }

    return actionPromises;
}



module.exports = {
    handleAutomationForUser
}