const db = require('../dbFacade')
const { AUTOMATE_ACTION, CONFIG_TYPE } = require('../interface');
const logger = require('./logging');

const THRESHOLD_MINUTES = process.env.TIME_TO_EXEC_THRESHOLD_MIN ?? 5
const BUFFER_IN_RANGE_MS = process.env.TIME_TO_EXEC_BUFFER_MS ?? 5000; // add buffer so ${duaDate} and ${now} don't need to overlap perfectly

class AutomationAction {
    constructor(user, action, configType, dueAt) {
        this.user = user;
        this.actionType = action;
        this.configType = configType;
        this.dueAt = dueAt;
    }


    timeToExecute(time) {
        const timeDiff = Math.abs(time.getTime() - this.dueAt.getTime())
        logger.debug(`dueAt: ${this.dueAt.toUTCString()}\ttime: ${time.toUTCString()}\ttime diff: ${timeDiff}`)

        return timeDiff <= BUFFER_IN_RANGE_MS ||
            // add a buffer of ${thresholdMinutes} after ${dueDate} in which the action is still executed
            (time.getTime() >= this.dueAt.getTime() && timeDiff <= (THRESHOLD_MINUTES * 60 * 1000))
    }

    toString() {
        return `\t${this.user.username}\t${this.actionType}\t${this.configType}\t${this.dueAt.toUTCString()}`
    }
}

async function getActionsForDate(user, date) {
    const actionsList = []

    const dailyConfig = await db.getDailyConfig(user.username, date)
    if (dailyConfig?.startAt) {
        logger.debug('found start action')
        actionsList.push(new AutomationAction(user, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.DAILY, dailyConfig.startAt, undefined))
    }
    if (dailyConfig?.endAt) {
        logger.debug('found stop action')
        actionsList.push(new AutomationAction(user, AUTOMATE_ACTION.STOP_BTN, CONFIG_TYPE.DAILY, dailyConfig.endAt, undefined))
    }

    const weeklyConfig = await db.getWeeklyConfig(user.username, date)
    if (weeklyConfig?.startAt) {
        logger.debug('found start action')
        actionsList.push(new AutomationAction(user, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.WEEKLY, weeklyConfig.startAt, undefined))
    }
    if (weeklyConfig?.endAt) {
        logger.debug('found stop action')
        actionsList.push(new AutomationAction(user, AUTOMATE_ACTION.STOP_BTN, CONFIG_TYPE.WEEKLY, weeklyConfig.endAt, undefined))
    }

    return actionsList;
}

class AutomationActionResult extends AutomationAction {

    /**
     * @param {getUsers() return} user 
     * @param {AUTOMATE_ACTION} action 
     * @param {CONFIG_TYPE} configType 
     * @param {Date} dueAt 
     * @param {string} message 
     * @param {string} error 
     */
    constructor(user, action, configType, dueAt, message, error) {
        super(user, action, configType, dueAt)
        this.message = message;
        this.error = error
    }
}

module.exports = {
    AutomationAction,
    AutomationActionResult,
    getActionsForDate,
    THRESHOLD_MINUTES,
    BUFFER_IN_RANGE_MS
}