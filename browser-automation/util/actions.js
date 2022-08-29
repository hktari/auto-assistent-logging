const db = require('../dbFacade')
const { AUTOMATE_ACTION, CONFIG_TYPE } = require('../interface');
const logger = require('./logging');

class AutomationAction {
    constructor(user, action, configType, dueAt) {
        this.user = user;
        this.actionType = action;
        this.configType = configType;
        this.dueAt = dueAt;
    }


    timeToExecute(time) {
        const thresholdMinutes = 5
        const bufferInRangeMs = 5000; // add buffer so ${duaDate} and ${now} don't need to overlap perfectly
        const timeDiff = Math.abs(time.getTime() - this.dueAt.getTime())

        return timeDiff <= bufferInRangeMs ||
            // add a buffer of ${thresholdMinutes} after ${dueDate} in which the action is still executed
            (time.getTime() >= this.dueAt.getTime() && timeDiff < (thresholdMinutes * 60 * 1000))
    }

    toString(){
        return `\t${this.user.username}\t${this.actionType}\t${this.configType}\t${this.dueAt.toUTCString()}`
    }
}

async function getActionsForDate(user, date) {
    const actionsList = []

    const dailyConfig = await db.getDailyConfig(user.username, date)
    logger.debug(JSON.stringify(dailyConfig))
    if (dailyConfig?.startAt) {
        actionsList.push(new AutomationAction(user, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.DAILY, dailyConfig.startAt, undefined))
    }
    if (dailyConfig?.endAt) {
        actionsList.push(new AutomationAction(user, AUTOMATE_ACTION.STOP_BTN, CONFIG_TYPE.DAILY, dailyConfig.endAt, undefined))
    }

    const weeklyConfig = await db.getWeeklyConfig(user.username, date)
    if (weeklyConfig?.startAt) {
        actionsList.push(new AutomationAction(user, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.WEEKLY, weeklyConfig.startAt, undefined))
    }
    if (weeklyConfig?.endAt) {
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

    isSuccessful() {
        // todo: implement
        return false;
    }
}

module.exports = {
    AutomationAction,
    AutomationActionResult,
    getActionsForDate
}