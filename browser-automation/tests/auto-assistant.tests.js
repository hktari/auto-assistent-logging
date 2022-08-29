const chai = require('chai')
const { expect, assert } = require("chai");
const { describe, it } = require("mocha");
const { handleAutomationForUser } = require("../auto-assistant");
const { AUTOMATE_ACTION, CONFIG_TYPE } = require("../interface");
const { AutomationAction, AutomationActionResult } = require("../util/actions");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');

chai.use(deepEqualInAnyOrder);

describe('auto-assistant.js', () => {
    describe('handleAutomationForUser()', () => {

        const testUser = {
            login_info_id: 0,
            email: 'test@example.com',
            automationEnabled: true,
            username: 'test',
            password: 'secret'
        }

        const dateAutomationExists = new Date(Date.UTC(2022, 7, 1))
        const automationActionsForUser = {
            'test': [
                new AutomationActionResult(
                    testUser,
                    AUTOMATE_ACTION.START_BTN,
                    CONFIG_TYPE.WEEKLY,
                    new Date(Date.UTC(2022, 7, 1, 12, 0)),
                    'Successfully executed start_btn action',
                    null),
                new AutomationActionResult(
                    testUser,
                    AUTOMATE_ACTION.STOP_BTN,
                    CONFIG_TYPE.WEEKLY,
                    new Date(Date.UTC(2022, 7, 1, 20, 0)),
                    'Successfully executed stop_btn action',
                    null)

            ]
        }

        it('should return an array of AutomationActionResult', (done) => {
            handleAutomationForUser(testUser, dateAutomationExists)
                .then(actionResults => {
                    expect(actionResults).to.deep.equalInAnyOrder(automationActionsForUser)
                    done()
                })
                .catch(err => done(err))
        })

        // it('for date when no automation action exists, it should return an empty array', (done) => {

        // })

        // it('for date when weekly exception, it should not return weekly automation action', (done) => {

        // })

        // it('for date when action already executed, it should not return automation action', (done) => {

        // })

        // it('for date when daily automation action exists, it should return daily automation action', (done) => {

        // })

        // it('for date when weekly automation action exists, it should return weekly automation action', (done) => {

        // })

        // it('for date when daily and weekly automation action exist, it should return daily automation action', (done) => {

        // })
    })
})