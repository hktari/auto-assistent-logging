const { expect } = require('chai')
const { describe, it } = require('mocha');
const { AUTOMATE_ACTION, LogEntry, LOG_ENTRY_STATUS } = require('../interface');
const { executeAction } = require('../mddsz-api')
const db = require('../dbFacade')

// require('chai-as-promised')

describe('mddsz-api', function () {
    this.timeout(60000);

    it('executeAction', (done) => {
        executeAction(process.env.MDDSZ_USERNAME, process.env.MDDSZ_PASSWORD, AUTOMATE_ACTION.START_BTN)
            .then(res => done())
            .catch(err => done(err))
    })

    it('executeAction adds log entry', (done) => {
        executeAction(process.env.MDDSZ_USERNAME, process.env.MDDSZ_PASSWORD, AUTOMATE_ACTION.START_BTN)
            .then(res => {
                db.getLogEntries(process.env.MDDSZ_USERNAME, new Date()).then(queryResult => {
                    expect(queryResult.rowCount).to.be.greaterThan(0)
                    expect(queryResult.rows)
                })
                done()
            })
            .catch(err => done(err))
    })
})
