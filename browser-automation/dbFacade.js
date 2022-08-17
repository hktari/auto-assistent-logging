const { AUTOMATE_ACTION, WORKDAY_CONFIG_AUTOMATION_TYPE, LOG_ENTRY_STATUS, WorkdayConfig } = require('./interface')
const { db } = require('./database');
const crypto = require('./util/crypto');
const { dayOfWeekToAbbrv } = require('./util');


async function shouldExecute(username, action, dueDate, now) {
    // if no successful record in 'log_entry' table for given user, given action, for dueDate
    const queryResult = await db.query(`SELECT *
                                        FROM log_entry le JOIN login_info li on le.login_info_id = li.id
                                        WHERE li.username = $1 
                                        AND date_trunc('day', le.timestamp) = date_trunc('day', timestamp '${dueDate.toISOString()}')
                                        AND action = $2
                                        AND status = $3;`, [username, action, LOG_ENTRY_STATUS.SUCCESSFUL])
    if (queryResult.rowCount > 0) {
        console.debug(`Already executed sucessfully action ${action} today for user ${username}`)
        return false;
    } else {
        return true;
    }
}

async function getDailyConfig(username, date) {
    const queryResult = await db.query(`SELECT dc.date, dc.start_at, dc.end_at, dc.automation_type, li.username
                    FROM daily_config dc JOIN login_info li ON dc.login_info_id = li.id
                    WHERE li.username = $1 
                    AND date_part('day', dc.date) = date_part('day', date '${date.toISOString()}');`, [username])

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
 * Also decrypts the password
 * @param {boolean} onlyAutomateEnabled 
 */
async function getUsers(onlyAutomateEnabled = true) {
    const queryResult = await db.query(`SELECT li.id as login_info_id, a.email, a."automationEnabled", li.username, 
                                        encode(li.password_cipher, 'hex') as password_cipher, encode(li.iv_cipher, 'hex') as iv_cipher
                                        FROM account a JOIN login_info li on a.id = li.account_id
                                        WHERE "automationEnabled" = ${onlyAutomateEnabled};`)

    let users = queryResult.rows.map(row => {
        try {
            const password = crypto.decrypt(row.iv_cipher, row.password_cipher)
            return {
                login_info_id: row.login_info_id,
                email: row.email,
                automationEnabled: row.automationEnabled,
                username: row.username,
                password: password
            }
        } catch (err) {
            console.error(`Failed to map user ${row.email}. Probably failure in decrypting password.`, err, JSON.stringify(row))
            return null;
        }
    });

    // filter out users with decryption errors
    users = users.filter(user => user !== null)
    return users
}

async function addLogEntry(login_info_id, status, timestamp, error, message, action) {
    const queryResult = await db.query(`INSERT INTO log_entry (login_info_id, status, "timestamp", error, message, "action")
                                        VALUES ($1, $2, $3, $4, $5, $6);`,
        [login_info_id, status, timestamp.toUTCString(), error, message, action])
    console.log('[AUTOMATION]: inserted ' + queryResult.rowCount + ' rows');
    return queryResult.rowCount;
}

async function anyLogEntryOfType(login_info_id, status, action, date) {
    const queryResult = await db.query(
        `SELECT count(1) as count
        FROM log_entry le
        WHERE le.login_info_id = $1 
        AND action = $2
        AND status = $3
        AND date_part('day', le.timestamp) = date_part('day', date '${date.toISOString()}');`, [login_info_id, action, status])
    return +queryResult.rows[0].count > 0
}

module.exports = {
    getUsers,
    getWeeklyConfig,
    checkForExecutionFailure,
    getDailyConfig,
    shouldExecute,
    addLogEntry,
    anyLogEntryOfType
}