const { doesNotMatch } = require('assert')
const { expect } = require('chai')
const { describe, it } = require('mocha')
const { executeAction, MDDSZApiError } = require('../mddsz-api')
// require('chai-as-promised')

describe('mddsz-api', () => {
    it('executeAction', (done) => {
        return executeAction('bostjankamnik45', 'secret', 'start_btn')
        .then(res => done())
            .catch(err => done(err))
    })
})
