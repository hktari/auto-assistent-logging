const AUTOMATE_ACTION = Object.freeze({
    START_BTN: 'start_btn',
    STOP_BTN: 'stop_btn'
})

const LOG_ENTRY_STATUS = Object.freeze({
    SUCCESSFUL: 'successful',
    FAILED: 'failed'
})

const DAILY_CONFIG_AUTOMATION_TYPE = Object.freeze({
    AUTOMATE: 'automate',
    NO_AUTOMATE: 'no_automate' // don't do automation for that day despite weekly config
})

module.exports = {
    AUTOMATE_ACTION,
    LOG_ENTRY_STATUS,
    DAILY_CONFIG_AUTOMATION_TYPE
}
