const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig } = require('../interface')
const { db } = require('../database');

async function shouldExecute(username, action, dueDate, now) {
    // if no successful record in 'log_entry' table for given user, given action, for dueDate
    const queryResult = await db.query(`SELECT *
                                        FROM log_entry le JOIN login_info li on le.login_info_id = li.id
                                        WHERE li.username = $1 
                                        AND date_trunc('day', le.timestamp) = date_trunc('day', timestamp $2)
                                        AND action = $3
                                        AND status = $4;`, [username, dueDate, action, LOG_ENTRY_STATUS.SUCCESSFUL])
    if (queryResult.rowCount > 0) {
        console.debug(`Already executed sucessfully action ${action} today for user ${username}`)
        return false;
    } else {
        return true;
    }
}

async function getDailyConfig(username, date) {
    const queryResult = await db.query(`SELECT dc.date, dc.start_at, dc.end_at, dc.automation_type
                    FROM daily_config dc JOIN login_info li ON dc.login_info_id = li.id
                    WHERE li.username = $1 AND date dc.date = $2;`, [username, date.toISOString().substring(0, 10)])

    if (queryResult.rowCount === 0) {
        return null;
    } else {
        const firstRow = queryResult.rows[0];
        return new WorkdayConfig(firstRow.username, firstRow.start_at, firstRow.end_at, firstRow.date, firstRow.automation_type)
    }
}


async function checkForExecutionFailure() {
    return Promise.resolve(false);
}

async function getWeeklyConfig(username, date) {
    const today = dayOfWeekToAbbrv(date.getDay())
    const queryResult = await db.query(`SELECT wwc.day, wwc.start_at, wwc.end_at, li.username
                                        FROM work_week_config wwc JOIN login_info li on wwc.login_info_id = li.id
                                        WHERE li.username = $1 AND LOWER(wwc.day) = $2;`, [username, today])
    if (queryResult.rowCount > 0) {
        const firstRow = queryResult.rows[0];
        return new WorkdayConfig(firstRow.username, firstRow.start_at, firstRow.end_at, date, WORKDAY_CONFIG_AUTOMATION_TYPE.AUTOMATE);
    } else {
        return null;
    }
}

/**
 * Get user data from the 'user' and 'login_info' tables
 * @param {boolean} onlyAutomateEnabled 
 */
async function getUsers(onlyAutomateEnabled = true) {
    const queryResult = await db.query(`SELECT li.id as login_info_id, a.email, a."automationEnabled", li.username, li.password
                                        FROM account a JOIN login_info li on a.id = li.user_id
                                        WHERE "automationEnabled" = ${onlyAutomateEnabled};`)

    // TODO: decrypt password
    return queryResult.rows;
}

async function addLogEntry(login_info_id, status, timestamp, error, message, action) {
    const queryResult = await db.query(`INSERT INTO log_entry (login_info_id, status, "timestamp", error, message, "action")
                                        VALUES ($1, $2, $3, $4, $5, $6);`,
                                        [login_info_id, status, timestamp, error, message, action])
    console.log('[AUTOMATION]: inserted ' + queryResult.rowCount + ' rows');
    return queryResult.rowCount;
}

module.exports = {
    getUsers,
    getWeeklyConfig,
    checkForExecutionFailure,
    getDailyConfig,
    shouldExecute,
    addLogEntry,
}