const db = require('../dbFacade')
const { AUTOMATE_ACTION, CONFIG_TYPE } = require('../interface')

class AutomationAction {
    // todo: remove message
    constructor(user, action, configType, dueAt, message) {
        this.user = user;
        this.actionType = action;
        this.configType = configType;
        this.dueAt = dueAt;
        this.message = message
    }


    timeToExecute(time) {
        const thresholdMinutes = 5
        const bufferInRangeMs = 5000; // add buffer so ${duaDate} and ${now} don't need to overlap perfectly
        const timeDiff = Math.abs(time.getTime() - dueDate.getTime())

        return timeDiff <= bufferInRangeMs ||
            // add a buffer of ${thresholdMinutes} after ${dueDate} in which the action is still executed
            (time.getTime() >= dueDate.getTime() && timeDiff < (thresholdMinutes * 60 * 1000))
    }
}

async function getActionsForDate(username, date) {
    const actionsList = []

    const dailyConfig = await db.getDailyConfig(username, date)
    if (dailyConfig?.startAt !== null) {
        actionsList.push(new AutomationAction(dailyConfig.username, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.DAILY, dailyConfig.startAt, undefined))
    }
    if (dailyConfig?.endAt !== null) {
        actionsList.push(new AutomationAction(dailyConfig.username, AUTOMATE_ACTION.STOP_BTN, CONFIG_TYPE.DAILY, dailyConfig.endAt, undefined))
    }

    const weeklyConfig = await db.getWeeklyConfig(username, date)
    if (weeklyConfig?.startAt !== null) {
        actionsList.push(new AutomationAction(weeklyConfig.username, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.WEEKLY, weeklyConfig.startAt, undefined))
    }
    if (weeklyConfig?.endAt !== null) {
        actionsList.push(new AutomationAction(weeklyConfig.username, AUTOMATE_ACTION.STOP_BTN, CONFIG_TYPE.WEEKLY, weeklyConfig.endAt, undefined))
    }

    return actionsList;
}

class AutomationActionResult extends AutomationAction {
    constructor(automationAction, message, error) {
        super(automationAction.username, automationAction.action, automationAction.configType, automationAction.dueAt)
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