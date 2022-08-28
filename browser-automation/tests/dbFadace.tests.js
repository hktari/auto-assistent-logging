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
                //   * @param { string } username
                //                     * @param { string } startAt 14: 00
                //                         * @param { string } endAt 22: 00
                //                             * @param { string | Date } date
                done()
            }).catch(err => done(err))
        })
    })
})