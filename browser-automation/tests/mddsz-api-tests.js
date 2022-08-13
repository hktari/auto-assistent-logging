const { expect } = require('chai')
const { describe, it } = require('mocha')
const mddszApi = require('../mddsz-api')

describe('mddsz-api', () => {
    beforeEach(() => {
    })
    it('executeAction', async () => {
        const result = await mddszApi.executeAction('bosjankamnik45', 'secret', 'start_btn')
        expect(result).to.not.be.null()
    })
})
