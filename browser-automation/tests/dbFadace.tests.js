const { assert, expect } = require("chai");
const { describe, it } = require("mocha");

describe('dbFacade', () => {
    it('should import without errors', () => {
        const db = require('../dbFacade')
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

        const usersWithRequiredFields = [
            {
                id: 1,
                email: 'test@example.com',
                automationEnabled: true,
                username: 'test',
                password: 'secret'
            }
        ]
        db.getUsers().then(users => {

            users.forEach((user, idx) =>{
                expect(user).to.deep.equal(usersWithRequiredFields[idx])
            })
            
            done()
        }).catch(err => done(err))
    })
})