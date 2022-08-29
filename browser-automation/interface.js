const { isNullOrUndefined } = require("util");
const logger = require("./util/logging");

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

class WorkweekException {
    constructor(username, date, action) {
        this.username = username;
        if (date instanceof Date) {
            this.date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
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
        this.error = error
        this.message = message
        this.action = action
        this.configType = configType

        if (timestamp instanceof Date) {
            this.timestamp = new Date(Date.UTC(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate(), timestamp.getHours(), timestamp.getMinutes(), timestamp.getSeconds()))
        } else {
            this.timestamp = new Date(Date.parse(timestamp))
        }
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

        const startAtHrs = this._parseTimeOrNan(startAt)[0];
        const endAtHrs = this._parseTimeOrNan(endAt)[0];

        // when end at is greater than start at we have to increase the date
        let dayAfter = null;
        if (endAtHrs < startAtHrs) {
            dayAfter = new Date(this.date.getTime())
            dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)
        }

        this.endAt = this._parseDateAndTimeOrNull(dayAfter ?? date, endAt);
    }

    _parseDateAndTimeOrNull(date, timeStr) {
        if (date === null || date === undefined) { return null }
        
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
    CONFIG_TYPE,
    WorkweekException,
    LogEntry,
    WorkdayConfig
}
