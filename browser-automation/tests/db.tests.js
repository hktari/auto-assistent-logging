const { expect } = require('chai');
const { db } = require('../database');


describe('database', () => {
    it('Date object should have property getTime', () => {
        const d = new Date()

        expect(() => d.getTime()).to.not.throw()
        expect(typeof d.getTime()).to.eq('number')
    })
    it('select daily_config return Date object', (done) => {
        db.query('SELECT * FROM daily_config;')
            .then(queryResult => {
                expect(queryResult.rowCount).to.be.greaterThan(0)
                const date = queryResult.rows[0].date
                expect(() => date.getTime()).to.not.throw()
                expect(typeof date.getTime()).to.eq('number')
                done()
            })
            .catch(err => done(err))
    })
})