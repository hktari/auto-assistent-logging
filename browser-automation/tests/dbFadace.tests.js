const chai = require('chai')
const { assert, expect } = require("chai");
const { DESTRUCTION } = require("dns");
const { describe, it } = require("mocha");
const { db } = require("../database");
const { AUTOMATE_ACTION, LOG_ENTRY_STATUS, CONFIG_TYPE, LogEntry } = require("../interface");

chai.config.truncateThreshold = 0

describe('dbFacade', () => {

    const usersWithRequiredFields = [
        {
            login_info_id: "0",
            email: 'test@example.com',
            automationEnabled: true,
            username: 'test',
            password: 'secret'
        },
        {
            login_info_id: "1",
            email: 'test2@example.com',
            automationEnabled: true,
            username: 'test2',
            password: 'secret2'
        }
    ]

    let db;
    beforeEach(() => {
        db = require('../dbFacade')
    })

    it('should import without errors', () => {
    })

    describe('getUsers()', () => {
        it('result should contain properties', (done) => {
            const db = require('../dbFacade')

            db.getUsers().then(users => {
                users.forEach((user, idx) => {
                    expect(user).to.deep.equal(usersWithRequiredFields[idx])
                })
                done()
            }).catch(err => done(err))
        })

        it('should return two users', (done) => {
            db.getUsers(onlyAutomateEnabled = false).then((res) => {
                assert(res.length === 2, 'users array contains two entries')
                done()
            }).catch(err => {
                done(err)
            })
        })

        it('should return a single user with automationEnabled', (done) => {
            db.getUsers()
                .then(usersList => {
                    expect(usersList.length).to.equal(1)
                    expect(usersList[0].automationEnabled).to.be.true
                    done()
                })
                .catch(err => done(err))
        })
    })



    describe('getDailyConfig()', () => {
        const dailyConfigsPerUser = {
            'test': {
                username: 'test',
                startAt: new Date(Date.UTC(2022, 4, 1, 12, 0)),
                endAt: new Date(Date.UTC(2022, 4, 1, 20, 0)),
                date: new Date(Date.UTC(2022, 4, 1))
            }
        }
        it('return value should contain properties', (done) => {
            db.getDailyConfig('test', new Date(Date.UTC(2022, 4, 1))).then(dailyConfig => {
                expect(dailyConfig).to.deep.equal(dailyConfigsPerUser['test'])
                done()
            }).catch(err => done(err))
        })

        it('return value should be null when no entries', (done) => {
            db.getDailyConfig('test2', new Date(Date.UTC(2022, 4, 1)))
                .then(dailyConfig => {
                    expect(dailyConfig).to.be.null
                    done()
                })
                .catch(err => done(err))
        })

        it('return value should be null for another date', (done) => {
            db.getDailyConfig('test', new Date(Date.UTC(2022, 4, 2)))
                .then(dailyConfig => {
                    expect(dailyConfig).to.be.null
                    done()
                })
                .catch(err => done(err))
        })
        it('different month, same day returns null', (done) => {
            db.getDailyConfig('test', new Date(Date.UTC(2022, 8, 1)))
                .then(dailyConfig => {
                    expect(dailyConfig).to.be.null
                    done()
                })
                .catch(err => done(err))
        })
    })


    describe('getWeeklyConfig()', () => {
        const weeklyConfigPerUser = {
            'test': [
                {
                    date: new Date(Date.UTC(2022, 7, 1)),
                    config: {
                        username: 'test',
                        startAt: new Date(Date.UTC(2022, 7, 1, 12, 0)),
                        endAt: new Date(Date.UTC(2022, 7, 1, 20, 0)),
                        date: new Date(Date.UTC(2022, 7, 1))
                    }
                },
                {
                    date: new Date(Date.UTC(2022, 7, 2)),
                    config: {
                        username: 'test',
                        startAt: new Date(Date.UTC(2022, 7, 2, 14, 0)),
                        endAt: new Date(Date.UTC(2022, 7, 2, 24, 0)),
                        date: new Date(Date.UTC(2022, 7, 2))
                    }
                },
                {
                    date: new Date(Date.UTC(2022, 7, 3)),
                    config: {
                        username: 'test',
                        startAt: new Date(Date.UTC(2022, 7, 3, 12, 0)),
                        endAt: new Date(Date.UTC(2022, 7, 3, 20, 0)),
                        date: new Date(Date.UTC(2022, 7, 3))
                    }
                },
                {
                    date: new Date(Date.UTC(2022, 7, 4)),
                    config: {
                        username: 'test',
                        startAt: new Date(Date.UTC(2022, 7, 4, 20, 0)),
                        endAt: new Date(Date.UTC(2022, 7, 5, 4, 0)),
                        date: new Date(Date.UTC(2022, 7, 4))
                    }
                },
                {
                    date: new Date(Date.UTC(2022, 7, 5)),
                    config: {
                        username: 'test',
                        startAt: new Date(Date.UTC(2022, 7, 5, 12, 0)),
                        endAt: new Date(Date.UTC(2022, 7, 5, 20, 0)),
                        date: new Date(Date.UTC(2022, 7, 5))
                    }
                },
                {
                    date: new Date(Date.UTC(2022, 7, 6)),
                    config: null
                },
                {
                    date: new Date(Date.UTC(2022, 7, 7)),
                    config: null
                }
            ]
        }


        it('return value should contain properties', (done) => {
            db.getWeeklyConfig('test', new Date(Date.UTC(2022, 7, 1)))
                .then(weeklyConfig => {
                    expect(weeklyConfig).to.deep.equal(weeklyConfigPerUser['test'][0].config)
                    done()
                })
                .catch(err => done(err))
        })

        it('return value should be null', (done) => {
            db.getWeeklyConfig('test2', new Date(Date.UTC(2022, 7, 1)))
                .then(weeklyConfig => {
                    expect(weeklyConfig).to.be.null
                    done()
                })
                .catch(err => done(err))
        })

        let t = new Date();
        weeklyConfigPerUser['test'].forEach(item => {
            const expectedConfig = item.config
            it('return value for weekday: ' + item.date.getDay() + ' should be equal', (done) => {
                db.getWeeklyConfig('test', item.date)
                    .then(weeklyConfig => {
                        expect(weeklyConfig).to.deep.equal(expectedConfig)
                        done()
                    })
                    .catch(err => done(err))
            })
        })
    })


    describe('getWorkweekExceptions()', () => {
        const workWeekExceptionsPerUser = {
            'test': [
                {
                    username: 'test',
                    date: new Date(Date.UTC(2022, 7, 8)),
                    action: AUTOMATE_ACTION.START_BTN
                },
                {
                    username: 'test',
                    date: new Date(Date.UTC(2022, 7, 8)),
                    action: AUTOMATE_ACTION.STOP_BTN
                }
            ]
        }

        it('return value should have length of 2', done => {
            db.getWorkweekExceptions('test', new Date(Date.UTC(2022, 7, 8)))
                .then(workWeekExceptList => {
                    expect(workWeekExceptList).to.have.lengthOf(2)
                    done()
                })
                .catch(err => done(err))
        })

        it('return value should contain a start_btn action', done => {
            db.getWorkweekExceptions('test', new Date(Date.UTC(2022, 7, 8)))
                .then(returnVal => {
                    const startBtnException = workWeekExceptionsPerUser['test'][0]
                    const returnedStartBtnExcept = returnVal.filter(val => val.action === AUTOMATE_ACTION.START_BTN)[0];
                    expect(returnedStartBtnExcept).to.exist
                    expect(startBtnException).to.deep.equal(returnedStartBtnExcept)
                    done()
                })
                .catch(err => done(err))
        })
        it('return value should contain a stop_btn action', done => {
            db.getWorkweekExceptions('test', new Date(Date.UTC(2022, 7, 8)))
                .then(returnVal => {
                    const stopBtnException = workWeekExceptionsPerUser['test'][0]
                    const returnedStopBtnExcept = returnVal.filter(val => val.action === AUTOMATE_ACTION.START_BTN)[0];
                    expect(returnedStopBtnExcept).to.exist
                    expect(stopBtnException).to.deep.equal(returnedStopBtnExcept)
                    done()
                })
                .catch(err => done(err))
        })

        it('return value should be empty list for another date', done => {
            db.getWorkweekExceptions('test', new Date(Date.UTC(2022, 7, 10)))
                .then(returnVal => {
                    expect(returnVal).to.be.empty
                    done()
                })
                .catch(err => done(err))
        })
    })

    describe('getLogEntry()', () => {
        const logEntriesPerUser = {
            'test': [
                {
                    username: 'test',
                    status: LOG_ENTRY_STATUS.SUCCESSFUL,
                    error: null,
                    message: 'Sucessfully executed start_btn action',
                    action: AUTOMATE_ACTION.START_BTN,
                    configType: CONFIG_TYPE.WEEKLY,
                    timestamp: new Date(Date.UTC(2022, 7, 1, 14, 0)),
                },
                {
                    username: 'test',
                    status: LOG_ENTRY_STATUS.SUCCESSFUL,
                    error: null,
                    message: 'Sucessfully executed stop_btn action',
                    action: AUTOMATE_ACTION.STOP_BTN,
                    configType: CONFIG_TYPE.WEEKLY,
                    timestamp: new Date(Date.UTC(2022, 7, 1, 22, 0)),
                },
                {
                    username: 'test',
                    status: LOG_ENTRY_STATUS.FAILED,
                    timestamp: new Date(Date.UTC(2022, 7, 2, 8, 0)),
                    error: 'Failed to execute start_btn action',
                    message: null,
                    action: AUTOMATE_ACTION.START_BTN,
                    configType: CONFIG_TYPE.DAILY
                },
            ]
        }

        it('should return an object with all properties', (done) => {
            const time = new Date(Date.UTC(2022, 7, 1))
            db.getLogEntries('test', time)
                .then(logEntries => {
                    expect(logEntries).to.have.lengthOf(2)

                    const startBtnLE = logEntries.filter(le => le.action === AUTOMATE_ACTION.START_BTN)
                    expect(startBtnLE).to.deep.include(logEntriesPerUser['test'][0])

                    const stopBtnLE = logEntries.filter(le => le.action === AUTOMATE_ACTION.STOP_BTN)
                    expect(stopBtnLE).to.deep.include(logEntriesPerUser['test'][1])


                    done()
                })
                .catch(err => done(err))
        })

        it('should return the newly added log entry', (done) => {

            const time = new Date(Date.UTC(2022, 7, 3, 14, 0))
            const newLE = new LogEntry(
                'test',
                LOG_ENTRY_STATUS.SUCCESSFUL,
                time,
                null,
                'Successfully executed start_btn actionSSS',
                AUTOMATE_ACTION.START_BTN,
                CONFIG_TYPE.DAILY)


            db.addLogEntry(0, newLE.status, newLE.timestamp, newLE.err, newLE.message, newLE.action, newLE.configType)
                .then(_ => {
                    db.getLogEntries('test', time)
                        .then(logEntries => {
                            expect(logEntries).to.deep.include(newLE)
                            done()
                        })
                })
                .catch(err => done(err))
        })

        it('should return an empty array for another user', (done) => {
            const time = new Date(Date.UTC(2022, 7, 1))
            db.getLogEntries('test2', time)
                .then(logEntries => {
                    expect(logEntries).to.be.empty
                    done()
                })
                .catch(err => done(err))
        })
    })

    describe('addLogEntry()', () => {
        it('should return a rowcount of 1', (done) => {
            const time = new Date(Date.UTC(2022, 7, 3, 14, 0))
            db.addLogEntry(0, LOG_ENTRY_STATUS.SUCCESSFUL, time, null, 'Successfully executed start_btn action', AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.WEEKLY)
                .then(rowCount => {
                    expect(rowCount).to.equal(1, 'Should add one row')
                    done()
                })
                .catch(err => done(err))
        })
    })
})