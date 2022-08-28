const { assert, expect } = require("chai");
const { describe, it } = require("mocha");
const { db } = require("../database");

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

    it('getUsers() should return two users', (done) => {
        const db = require('../dbFacade')

        db.getUsers().then((res) => {
            assert(res.length === 2, 'users array contains two entries')
            done()
        }).catch(err => {
            done(err)
        })
    })

    it('getusers() user entry should contain properties', (done) => {
        const db = require('../dbFacade')

        db.getUsers().then(users => {
            users.forEach((user, idx) => {
                expect(user).to.deep.equal(usersWithRequiredFields[idx])
            })
            done()
        }).catch(err => done(err))
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
})