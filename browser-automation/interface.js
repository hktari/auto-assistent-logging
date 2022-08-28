const CONFIG_TYPE = Object.freeze({
    DAILY: 'CONFIG_TYPE_DAILY',
    WEEKLY: 'CONFIG_TYPE_WEEKLY'
})

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

class WorkweekException {
    constructor(username, date, action) {
        this.username = username;
        if (date instanceof Date) {
            this.date = date
        } else {
            this.date = new Date(Date.parse(date))
        }
        this.action = action
    }
}

class LogEntry {
    constructor(username, status, timestamp, error, message, action, configType) {
        this.username = username
        this.status = status
        this.timestamp = timestamp
        this.error = error
        this.message = message
        this.action = action
        this.configType = configType
    }
}
class WorkdayConfig {
    /**
     * 
     * @param {string} username 
     * @param {string} startAt 14:00
     * @param {string} endAt 22:00
     * @param {string | Date} date 
     */
    constructor(username, startAt, endAt, date) {
        this.username = username;

        if (date instanceof Date) {
            this.date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        } else {
            this.date = new Date(Date.parse(date))
        }

        this.startAt = this._parseDateAndTimeOrNull(date, startAt)
        this.endAt = this._parseDateAndTimeOrNull(date, endAt);
    }

    _parseDateAndTimeOrNull(date, timeStr) {
        const [hours, min] = this._parseTimeOrNan(timeStr)
        if (!isNaN(hours) && !isNaN(min)) {
            // date is in local time, which is wrong. it should be in UTC, coz that's the database format
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, min));
        } else {
            return null;
        }
    }

    _parseTimeOrNan(timeStr) {
        const hours = +timeStr.split(':')[0]
        const minutes = +timeStr.split(':')[1]
        return [hours, minutes]
    }

    _isInvalidDate(date) {
        return date.toString().toLowerCase().includes('invalid')
    }

    toString() {
        const hoursFormat = (date) => `${date.getUTCHours()}:${date.getUTCMinutes()} UTC`
        return `Configuration: ${this.username} for ${this.date.toDateString()}
                \tstart: ${hoursFormat(this.startAt)}
                \tend: ${hoursFormat(this.endAt)}
                \t${this.automation_type}`
    }
}

module.exports = {
    AUTOMATE_ACTION,
    LOG_ENTRY_STATUS,
    WORKDAY_CONFIG_AUTOMATION_TYPE,
    CONFIG_TYPE,
    WorkweekException,
    LogEntry,
    WorkdayConfig
}
