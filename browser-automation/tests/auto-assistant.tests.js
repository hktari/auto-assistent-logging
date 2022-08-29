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
                    date: new Date(Date.UTC(2022, 7, 18)),
                    actions:
                        [
                            new AutomationActionResult(
                                testUser,
                                AUTOMATE_ACTION.START_BTN,
                                CONFIG_TYPE.DAILY,
                                new Date(Date.UTC(2022, 7, 18, 6, 0)),
                                'Successfully executed start_btn action',
                                null),
                            new AutomationActionResult(
                                testUser,
                                AUTOMATE_ACTION.STOP_BTN,
                                CONFIG_TYPE.DAILY,
                                new Date(Date.UTC(2022, 7, 18, 14, 0)),
                                'Successfully executed stop_btn action',
                                null),
                            new AutomationActionResult(
                                testUser,
                                AUTOMATE_ACTION.START_BTN,
                                CONFIG_TYPE.WEEKLY,
                                new Date(Date.UTC(2022, 7, 18, 20, 0)),
                                null,
                                null),
                            new AutomationActionResult(
                                testUser,
                                AUTOMATE_ACTION.STOP_BTN,
                                CONFIG_TYPE.WEEKLY,
                                new Date(Date.UTC(2022, 7, 19, 4, 0)),
                                null,
                                null),

                        ]
                },

            ]
    }

    function getActionsByDate(date, configType = null) {
        let matches = automationActionsForUser['test'].filter(i => i.date.getTime() === date.getTime())[0].actions
        if (configType) {
            matches = matches.filter(a => a.configType === configType)
        }

        return matches;
    }

    describe('filterOutAlreadyExecuted', () => {
        const actions = [
            new AutomationAction(testUser, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.DAILY, new Date(Date.UTC(2022, 7, 15, 12, 0))),
            new AutomationAction(testUser, AUTOMATE_ACTION.STOP_BTN, CONFIG_TYPE.DAILY, new Date(Date.UTC(2022, 7, 15, 20, 0))),
        ]
        const logEntries = [new LogEntry('test', LOG_ENTRY_STATUS.SUCCESSFUL, new Date(2022, 7, 15, 12, 0), null, 'successful', AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.DAILY)]

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
            executeActionStub.reset()
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

        it('weekly automation - it should return weekly automation action', (done) => {
            const weeklyActionDate = new Date(Date.UTC(2022, 15, 7, 12, 0))
            const automationAction = automationActionsForUser['test'][0].actions[0]
            executeActionStub.reset()
            executeActionStub.returns(Promise.resolve(automationAction.message))

            autoAssistant.handleAutomationForUser(testUser, automationAction.dueAt)
                .then(actionResults => {
                    expect(executeActionStub.calledOnce).to.be.true
                    expect(actionResults).to.have.lengthOf(1)
                    expect(actionResults[0]).to.deep.equal(automationAction)
                    done()
                })
                .catch(err => done(err))
        })

        describe('daily + weekly automation', () => {
            const date = new Date(Date.UTC(2022, 7, 18))

            for (const dailyAction of getActionsByDate(date, CONFIG_TYPE.DAILY)) {
                it(`expect daily automation for ${dailyAction.actionType}`, (done) => {
                    executeActionStub.reset()
                    executeActionStub.returns(Promise.resolve(dailyAction.message))

                    autoAssistant.handleAutomationForUser(testUser, dailyAction.dueAt)
                        .then(actionResults => {
                            expect(executeActionStub.calledOnce).to.be.true
                            expect(actionResults).to.have.lengthOf(1)
                            expect(actionResults[0]).to.deep.equal(dailyAction)
                            done()
                        })
                        .catch(err => done(err))
                })
            }

            for (const weeklyAction of getActionsByDate(date, CONFIG_TYPE.WEEKLY)) {
                it(`don't expect weekly automation for ${weeklyAction.actionType}`, (done) => {
                    console.log(weeklyAction.dueAt)
                    autoAssistant.handleAutomationForUser(testUser, weeklyAction.dueAt)
                        .then(actionResults => {
                            executeActionStub.reset()
                            executeActionStub.returns(Promise.resolve(weeklyAction.message))

                            expect(executeActionStub.calledOnce).to.be.false
                            expect(actionResults).to.have.lengthOf(0)
                            done()
                        })
                        .catch(err => done(err))
                })
            }
        })


        describe('when time is less than 8AM', () => {
            it('weekly stop_btn action from previous day is returned', (done) => {
                const yesterdayWeeklyAction = new AutomationActionResult(
                    testUser,
                    AUTOMATE_ACTION.STOP_BTN,
                    CONFIG_TYPE.WEEKLY,
                    new Date(Date.UTC(2022, 7, 26, 4, 0)),
                    'Successfuly executed stop_btn action',
                    null);

                executeActionStub.reset()
                executeActionStub.returns(Promise.resolve(yesterdayWeeklyAction.message))

                autoAssistant.handleAutomationForUser(testUser, yesterdayWeeklyAction.dueAt)
                    .then(actionResults => {
                        expect(executeActionStub.calledOnce, 'executeAction() was called').to.be.true
                        expect(actionResults).to.have.lengthOf(1)
                        expect(actionResults[0]).to.deep.equal(yesterdayWeeklyAction)
                        done()
                    })
                    .catch(err => done(err))
            })

            it('and already executed stop_btn from previous day, empty is returned', (done) => {
                const yesterdayWeeklyActionExecuted = new AutomationActionResult(
                    testUser,
                    AUTOMATE_ACTION.STOP_BTN,
                    CONFIG_TYPE.WEEKLY,
                    new Date(Date.UTC(2022, 8, 2, 4, 0)),
                    null,
                    null);

                executeActionStub.reset()
                executeActionStub.returns(Promise.resolve(yesterdayWeeklyActionExecuted.message))

                autoAssistant.handleAutomationForUser(testUser, yesterdayWeeklyActionExecuted.dueAt)
                    .then(actionResults => {
                        expect(executeActionStub.calledOnce, 'executeAction() was called').to.be.false
                        expect(actionResults).to.have.lengthOf(0)
                        done()
                    })
                    .catch(err => done(err))
            })
        })

        // it('for date when daily automation action exists, it should return daily automation action', (done) => {
        //     const 
        // })

        it('when no automation action exists, it should return an empty array', (done) => {
            const noAutomationDatetime = new Date(Date.UTC(2022, 7, 20)) // saturday
            autoAssistant.handleAutomationForUser(testUser, noAutomationDatetime)
                .then(actionResults => {
                    expect(actionResults).to.have.lengthOf(0)
                    done()
                })
                .catch(err => done(err))
        })

        it('when weekly exception, it should not return weekly automation action', (done) => {
            const exceptionDatetime = new Date(Date.UTC(2022, 7, 17, 12, 0))
            autoAssistant.handleAutomationForUser(testUser, exceptionDatetime)
                .then(actionResults => {
                    expect(actionResults, 'no actions returned').to.have.lengthOf(0)
                    done()
                })
                .catch(err => done(err))
        })

        it('when action already executed, it should not return automation action', (done) => {
            const alreadyExecutedDatetime = new Date(Date.UTC(2022, 7, 16, 14, 0))
            autoAssistant.handleAutomationForUser(testUser, alreadyExecutedDatetime)
                .then(actionResults => {
                    expect(actionResults).to.have.lengthOf(0)
                    done()
                })
                .catch(err => done(err))
        })
    })

    describe('logAutomationResult()', () => {
        it('should return 1 when valid', (done) => {
            const validAutomationResult = new AutomationActionResult(testUser, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.WEEKLY, new Date(Date.UTC(2022, 10, 1, 12, 0)), 'Successfuly executed start_btn action')

            autoAssistant.logAutomationResult(validAutomationResult)
                .then(insertCnt => {
                    expect(insertCnt).to.equal(1)
                    done()
                })
                .catch(err => done(err))
        })
        it('expect logEntries() to return newly added', (done) => {
            const newlyAdded = new LogEntry(
                testUser.username,
                LOG_ENTRY_STATUS.SUCCESSFUL,
                new Date(Date.UTC(2022, 10, 2, 12, 0)),
                null,
                'Successfuly executed start_btn action',
                AUTOMATE_ACTION.START_BTN,
                CONFIG_TYPE.WEEKLY,
            )

            const db = require('../dbFacade')
            autoAssistant.logAutomationResult(new AutomationActionResult(testUser, newlyAdded.action, newlyAdded.configType, newlyAdded.timestamp, newlyAdded.message, newlyAdded.error))
                .then(_ => {
                    return db.getLogEntries(testUser.username, newlyAdded.timestamp)
                        .then(logEntries => {
                            expect(logEntries).to.deep.contain(newlyAdded)
                            done()
                        })
                })
                .catch(err => done(err))
        })
        // todo: implement
        // it('should throw error when invalid', (done) => {
        //     const invalidAutomationResult = new AutomationActionResult(
        //         testUser,
        //         AUTOMATE_ACTION.START_BTN,
        //         CONFIG_TYPE.WEEKLY,
        //         new Date(Date.UTC(2022, 10, 1, 12, 0)),
        //         'Successfuly executed start_btn action')

        //     autoAssistant.logAutomationResult(invalidAutomationResult)
        //         .then(insertCnt => {
        //             expect(insertCnt, 'expecting exception').to.equal(0)
        //             done(true)
        //         })
        //         .catch(err => {
        //             done()
        //         })
        // })
    })
})