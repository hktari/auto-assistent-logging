const db = require('../dbFacade')
const { AUTOMATE_ACTION, CONFIG_TYPE } = require('../interface')

class AutomationAction {
    constructor(username, action, configType, dueAt, message) {
        this.username = username;
        this.action = action;
        this.configType = configType;
        this.dueAt = dueAt;
        this.message = message
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


module.exports = {
    AutomationAction,
    getActionsForDate
}