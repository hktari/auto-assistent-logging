const sinon = require('sinon')
const mddszApi = require('../mddsz-api')
const executeActionStub = sinon.stub(mddszApi, "executeAction");

const chai = require('chai')
const { expect, assert } = require("chai");
const { describe, it } = require("mocha");
const autoAssistant = require("../auto-assistant");
const { AUTOMATE_ACTION, CONFIG_TYPE, LogEntry, LOG_ENTRY_STATUS } = require("../interface");
const { AutomationAction, AutomationActionResult } = require("../util/actions");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');



chai.use(deepEqualInAnyOrder);
chai.config.truncateThreshold = 0

describe('auto-assistant.js', () => {
    const testUser = {
        login_info_id: 0,
        email: 'test@example.com',
        automationEnabled: true,
        username: 'test',
        password: 'secret'
    }

    const automationActionsForUser = {
        'test':
            [
                {
                    date: new Date(Date.UTC(2022, 7, 15)),
                    actions:
                        [
                            new AutomationActionResult(
                                testUser,
                                AUTOMATE_ACTION.START_BTN,
                                CONFIG_TYPE.WEEKLY,
                                new Date(Date.UTC(2022, 7, 15, 12, 0)),
                                'Successfully executed start_btn action',
                                null),
                            new AutomationActionResult(
                                testUser,
                                AUTOMATE_ACTION.STOP_BTN,
                                CONFIG_TYPE.WEEKLY,
                                new Date(Date.UTC(2022, 7, 15, 20, 0)),
                                'Successfully executed stop_btn action',
                                null)

                        ]
                },
                {
                    date: new Date(Date.UTC(2022, 7, 2)),
                    actions:
                        [
                            new AutomationActionResult(
                                testUser,
                                AUTOMATE_ACTION.START_BTN,
                                CONFIG_TYPE.WEEKLY,
                                new Date(Date.UTC(2022, 7, 15, 14, 0)),
                                'Successfully executed start_btn action',
                                null),
                            new AutomationActionResult(
                                testUser,
                                AUTOMATE_ACTION.STOP_BTN,
                                CONFIG_TYPE.WEEKLY,
                                new Date(Date.UTC(2022, 7, 15, 24, 0)),
                                'Successfully executed stop_btn action',
                                null)

                        ]
                },

            ]
    }
    describe('filterOutAlreadyExecuted', () => {
        const actions = [
            new AutomationAction(testUser, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.DAILY, new Date(Date.UTC(2022, 7, 15, 12, 0))),
            new AutomationAction(testUser, AUTOMATE_ACTION.STOP_BTN, CONFIG_TYPE.DAILY, new Date(Date.UTC(2022, 7, 15, 20, 0))),
        ]
        const logEntries = [new LogEntry('test', LOG_ENTRY_STATUS.SUCCESSFUL, new Date(Date.UTC(2022, 7, 15, 12, 0)), null, 'successful', AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.DAILY)]

        it('should not return the entry existing in both lists', () => {
            const filtered = autoAssistant._filterOutAlreadyExecuted(actions, logEntries)
            expect(filtered).to.have.lengthOf(1)
            expect(filtered).to.not.deep.include(actions[0])
        })

        it('should return the entry existing only inside the actions list', () => {
            expect(autoAssistant._filterOutAlreadyExecuted(actions, logEntries)).to.deep.include(actions[1])
        })
    })

    describe('handleAutomationForUser()', () => {

        it('should return an array of AutomationActionResult', (done) => {
            const automationAction = automationActionsForUser['test'][0].actions[0]
            executeActionStub.returns(Promise.resolve(automationAction.message))

            autoAssistant.handleAutomationForUser(testUser, automationAction.dueAt)
                .then(actionResults => {
                    expect(executeActionStub.calledOnce, 'stub is called').to.be.true
                    expect(actionResults).to.have.lengthOf(1, 'should return a single action')
                    expect(actionResults[0]).to.deep.equal(automationAction)
                    done()
                })
                .catch(err => done(err))
        })


        // it('for date when daily automation action exists, it should return daily automation action', (done) => {

        // })

        // it('for date when weekly automation action exists, it should return weekly automation action', (done) => {

        // })

        // it('for date when daily and weekly automation action exist, it should return daily automation action', (done) => {

        // })

        it('for date when no automation action exists, it should return an empty array', (done) => {
            const noAutomationDatetime = new Date(Date.UTC(2022, 7, 20)) // saturday
            autoAssistant.handleAutomationForUser(testUser, noAutomationDatetime)
                .then(actionResults => {
                    expect(actionResults).to.have.lengthOf(0)
                    done()
                })
                .catch(err => done(err))
        })

        it('for date when weekly exception, it should not return weekly automation action', (done) => {
            const exceptionDatetime = new Date(Date.UTC(2022, 7, 17, 12, 0))
            autoAssistant.handleAutomationForUser(testUser, exceptionDatetime)
                .then(actionResults => {
                    expect(actionResults, 'no actions returned').to.have.lengthOf(0)
                    done()
                })
                .catch(err => done(err))
        })

        it('for date when action already executed, it should not return automation action', (done) => {
            const alreadyExecutedDatetime = new Date(Date.UTC(2022, 7, 16, 14, 0))
            autoAssistant.handleAutomationForUser(testUser, alreadyExecutedDatetime)
                .then(actionResults => {
                    expect(actionResults).to.have.lengthOf(0)
                    done()
                })
                .catch(err => done(err))
        })
    })
})