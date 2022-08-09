const AUTOMATE_ACTION = Object.freeze({
    START_BTN: 'start_btn',
    STOP_BTN: 'stop_btn'
})

const LOG_ENTRY_STATUS = Object.freeze({
    SUCCESSFUL: 'successful',
    FAILED: 'failed'
})

const WORKDAY_CONFIG_AUTOMATION_TYPE = Object.freeze({
    AUTOMATE: 'automate',
    NO_AUTOMATE: 'no_automate' // don't do automation for that day despite weekly config
})

class WorkdayConfig {
    /**
     * 
     * @param {string} username 
     * @param {string} startAt 14:00
     * @param {string} endAt 22:00
     * @param {string | Date} date 
     * @param {WORKDAY_CONFIG_AUTOMATION_TYPE} automation_type 
     */
    constructor(username, startAt, endAt, date, automation_type) {
        this.username = username;

        this.startAt = new Date(date);
        this.startAt.setHours(+startAt.split(':')[0])
        this.startAt.setMinutes(+startAt.split(':')[1])
        console.log('user start at: ', this.startAt)

        this.endAt = new Date(date);
        this.endAt.setHours(+endAt.split(':')[0])
        this.endAt.setMinutes(+endAt.split(':')[1])
        console.log('user end at: ', this.endAt)


        if (date instanceof Date) {
            this.date = date
        } else {
            this.date = new Date(Date.parse(date))
        }

        const allDates = [this.startAt, this.endAt, date]
        for (const d in allDates) {
            if (d.toString().toLowerCase().includes('invalid')) {
                throw new Error('invalid date: ' + allDates)
            }
        }

        if (!Object.values(WORKDAY_CONFIG_AUTOMATION_TYPE).includes(automation_type)) {
            throw new Error(`invalid automation type: ${automation_type}`)
        }

        this.automation_type = automation_type;
    }
}

module.exports = {
    AUTOMATE_ACTION,
    LOG_ENTRY_STATUS,
    WORKDAY_CONFIG_AUTOMATION_TYPE,
    WorkdayConfig
}
