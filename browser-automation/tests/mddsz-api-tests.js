const { expect } = require('chai')
const { describe, it } = require('mocha');
const { AUTOMATE_ACTION } = require('../interface');
const { executeAction, MDDSZApiError } = require('../mddsz-api')
// require('chai-as-promised')

describe('mddsz-api', function () {
    this.timeout(60000);
    
    it('executeAction', (done) => {
        executeAction(process.env.MDDSZ_USERNAME, process.env.MDDSZ_PASSWORD, AUTOMATE_ACTION.START_BTN)
            .then(res => done())
            .catch(err => done(err))
    })
})
