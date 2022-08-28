const { assert } = require("chai");
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
        }).catch(err =>{
            done(err)
        })
    })
})