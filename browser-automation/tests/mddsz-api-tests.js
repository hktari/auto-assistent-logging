const { expect } = require('chai')
const { describe, it } = require('mocha')
const { executeAction, MDDSZApiError } = require('../mddsz-api')
// require('chai-as-promised')

describe('mddsz-api', function () {
    this.timeout(60000);
    
    it('executeAction', (done) => {
        executeAction('bostjankamnik45', 'secret', 'start_btn')
            .then(res => done())
            .catch(err => done(err))
    })
})
