const {
  AUTOMATE_ACTION,
  CONFIG_TYPE,
  LOG_ENTRY_STATUS,
  WorkdayConfig,
  WorkweekException,
  LogEntry,
  AUTOMATION_TYPE,
} = require("./interface");
const { db } = require("./database");
const crypto = require("./util/crypto");
const { dayOfWeekToAbbrv } = require("./util/util");
const logger = require("./util/logging");

/** NO TEST */
async function shouldExecute(username, action, dueDate, now) {
  // if no successful record in 'log_entry' table for given user, given action, for dueDate
  const queryResult = await db.query(
    `SELECT *
                                        FROM log_entry le JOIN login_info li on le.login_info_id = li.id
                                        WHERE li.username = $1 
                                        AND date_trunc('day', le.timestamp) = date_trunc('day', timestamp '${dueDate.toISOString()}')
                                        AND action = $2
                                        AND status = $3;`,
    [username, action, LOG_ENTRY_STATUS.SUCCESSFUL]
  );
  if (queryResult.rowCount > 0) {
    logger.debug(
      `Already executed sucessfully action ${action} today for user ${username}`
    );
    return false;
  } else {
    return true;
  }
}

async function getDailyConfig(username, date) {
  logger.debug("retrieving daily config...");
  const queryResult = await db.query(
    `SELECT dc.date, dc.start_at, dc.end_at,  li.username
                    FROM daily_config dc JOIN login_info li ON dc.login_info_id = li.id
                    WHERE li.username = $1 
                    AND DATE_TRUNC('day', dc.date) = DATE_TRUNC('day', date '${date.toISOString()}');`,
    [username]
  );

  if (queryResult.rowCount === 0) {
    return null;
  } else {
    const firstRow = queryResult.rows[0];
    return new WorkdayConfig(
      firstRow.username,
      firstRow.start_at,
      firstRow.end_at,
      firstRow.date
    );
  }
}

/** NO TEST */
async function checkForExecutionFailure() {
  return Promise.resolve(false);
}

async function getWeeklyConfig(username, date) {
  logger.debug("retrieving weekly config...");
  const today = dayOfWeekToAbbrv(date.getDay());
  const queryResult = await db.query(
    `SELECT wwc.day, wwc.start_at, wwc.end_at, li.username
                                        FROM work_week_config wwc JOIN login_info li on wwc.login_info_id = li.id
                                        WHERE li.username = $1 AND LOWER(wwc.day) = $2;`,
    [username, today]
  );
  if (queryResult.rowCount > 0) {
    const firstRow = queryResult.rows[0];
    return new WorkdayConfig(
      firstRow.username,
      firstRow.start_at,
      firstRow.end_at,
      date
    );
  } else {
    return null;
  }
}

/**
 *  * E-racuni User Configuration
 * @typedef {{accountId: string, itsClientId: string, itcSIDhomepage: string, appHomepageURL: string, appLoggedInURL: string}} ERacuniUserConfiguration
 */

/**
 * @param {string} accountId
 * @returns {Promise<ERacuniUserConfiguration | null>} ERacuni Configuration for given account
 */
async function getEracuniConfigurationBy(accountId) {
  const queryStr = `SELECT its_client_id, "itc_SID_homepage", "app_homepage_URL", "app_logged_in_URL", account_id
	FROM eracuni JOIN account ON eracuni.account_id = account.id 
	WHERE account.id = $1;`;

  const queryResult = await db.query(queryStr, [accountId]);
  if (queryResult.rowCount > 0) {
    const firstRow = queryResult.rows[0];

    return {
      accountId,
      itsClientId: firstRow.its_client_id,
      itcSIDhomepage: firstRow.itc_SID_homepage,
      appHomepageURL: firstRow.app_homepage_URL,
      appLoggedInURL: firstRow.app_logged_in_URL,
    };
  } else {
    return null;
  }
}

/**
 * Get user data from the 'user' and 'login_info' tables
 * Also decrypts the password
 *
 * @typedef User
 * @property {string} accountId
 * @property {string} login_info_id
 * @property {string} email
 * @property {boolean} automationEnabled
 * @property {string} username
 * @property {string} password
 *
 * @param {boolean} onlyAutomateEnabled
 * @returns {User[]} users
 */
async function getUsers(onlyAutomateEnabled = true) {
  let queryStr = `SELECT li.account_id as "accountId", li.id as login_info_id, a.email, a."automationEnabled", li.username, 
    encode(li.password_cipher, 'hex') as password_cipher, encode(li.iv_cipher, 'hex') as iv_cipher
    FROM account a JOIN login_info li on a.id = li.account_id`;

  if (onlyAutomateEnabled) {
    queryStr += `\nWHERE "automationEnabled" = ${onlyAutomateEnabled}`;
  }

  const queryResult = await db.query(queryStr);

  let users = queryResult.rows.map((row) => {
    try {
      const password = crypto.decrypt(row.iv_cipher, row.password_cipher);
      return {
        accountId: row.accountId,
        login_info_id: row.login_info_id,
        email: row.email,
        automationEnabled: row.automationEnabled,
        username: row.username,
        password: password,
      };
    } catch (err) {
      logger.error(
        `Failed to map user ${
          row.email
        }.Probably failure in decrypting password. ${err?.toString()}`
      );
      return null;
    }
  });

  // filter out users with decryption errors
  users = users.filter((user) => user !== null);
  return users;
}

/**
 *
 * @param {string} login_info_id
 * @param {LOG_ENTRY_STATUS} status
 * @param {Date} timestamp
 * @param {string} error
 * @param {string} message
 * @param {AUTOMATE_ACTION} action
 * @param {CONFIG_TYPE} configType
 * @param {AUTOMATION_TYPE} configType
 * @returns
 */
async function addLogEntry(
  login_info_id,
  status,
  timestamp,
  error,
  message,
  action,
  configType,
  automationType
) {
  const queryResult = await db.query(
    `INSERT INTO log_entry(login_info_id, status, "timestamp", error, message, "action", config_type, automation_type)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8); `,
    [
      login_info_id,
      status,
      timestamp.toUTCString(),
      error,
      message,
      action,
      configType,
      automationType,
    ]
  );
  logger.debug("[AUTOMATION]: inserted " + queryResult.rowCount + " rows");
  return queryResult.rowCount;
}

/**
 *
 * @param {string} username
 * @param {Date} date
 * @returns {Promise<LogEntry[]>}
 */
async function getLogEntries(username, date) {
  const queryResult = await db.query(
    `SELECT li.username, le.status, le.timestamp, le.error, le.message, le.action, le.config_type, le.automation_type
        FROM log_entry le JOIN login_info li ON le.login_info_id = li.id
        WHERE li.username = $1 
        AND DATE_TRUNC('day', le.timestamp) = DATE_TRUNC('day', date '${date.toISOString()}'); `,
    [username]
  );

  return queryResult.rows.map(
    (row) =>
      new LogEntry(
        row.username,
        row.status,
        row.timestamp,
        row.error,
        row.message,
        row.action,
        row.config_type,
        row.automation_type
      )
  );
}

/** NO TEST */
async function anyLogEntryOfType(login_info_id, status, action, date) {
  const queryResult = await db.query(
    `SELECT count(1) as count
        FROM log_entry le
        WHERE le.login_info_id = $1 
        AND action = $2
        AND status = $3
        AND DATE_TRUNC('day', le.timestamp) = DATE_TRUNC('day', date '${date.toISOString()}'); `,
    [login_info_id, action, status]
  );
  return +queryResult.rows[0].count > 0;
}

/**
 *
 * @param {string} username
 * @param {Date} date
 * @returns {Promise<WorkweekException[]>}
 */
async function getWorkweekExceptions(username, date) {
  const queryResult = await db.query(
    `SELECT li.username, wwe.date, wwe."action"
        FROM work_week_exception wwe JOIN work_week_config wwc ON wwe.work_week_config_id = wwc.id
        JOIN login_info li ON wwc.login_info_id = li.id
        WHERE li.username = $1 and date_part('day', wwe.date) = date_part('day', date '${date.toISOString()}')`,
    [username]
  );
  return queryResult.rows.map(
    (row) => new WorkweekException(row.username, row.date, row.action)
  );
}

module.exports = {
  getUsers,
  getWeeklyConfig,
  checkForExecutionFailure,
  getDailyConfig,
  shouldExecute,
  addLogEntry,
  getWorkweekExceptions,
  getLogEntries,
  anyLogEntryOfType,
  getEracuniConfigurationBy,
};
