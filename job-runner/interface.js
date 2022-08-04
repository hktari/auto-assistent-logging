const AUTOMATE_ACTION = Object.freeze({
    START_BTN: 'start_btn',
    STOP_BTN: 'stop_btn'
})

const JOB_STATUS = Object.freeze({
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed'
})

const JOB_ENTRY_STATUS = Object.freeze({
    SUCCESSFUL: 'successful',
    FAILED: 'failed'
})

module.exports = {
    AUTOMATE_ACTION,
    JOB_STATUS,
    JOB_ENTRY_STATUS
}
