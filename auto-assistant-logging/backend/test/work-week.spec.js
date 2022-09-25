const { expect } = require('chai')
const request = require('supertest');
const assert = require('assert');
const { abbrevToDayOfWeek } = require('./util.js');

describe('work week', () => {
    let app;
    let accessToken;
    beforeAll(async () => {
        app = require('../src/aal-server.js')

        const loginResult = await request(app)
            .post('/login/')
            .send({ email: 'existing.user@example.com', password: 'secret' })
        accessToken = loginResult.body.token
        console.log('accessToken', accessToken)
    })

    describe('GET /account/0/workweek', () => {
        it('should return 200 and work-week object', async () => {
            const result = [
                {
                    "day": "mon",
                    "start_at": "12:00",
                    "end_at": "20:00"
                },
                {
                    "day": "tue",
                    "start_at": "14:00",
                    "end_at": "24:00"
                },
                {
                    "day": "wed",
                    "start_at": "12:00",
                    "end_at": "20:00"
                },
                {
                    "day": "thu",
                    "start_at": "20:00",
                    "end_at": "04:00"
                },
                {
                    "day": "fri",
                    "start_at": "12:00",
                    "end_at": "20:00"
                },
            ]

            const response = await request(app)
                .get('/account/0/workweek')
                .auth(accessToken, { type: 'bearer' })

            expect(response.statusCode).to.eq(200)
            expect(response.body.sort(sortByDay)).to.eql(result.sort(sortByDay))
        })
    })

    describe('DELETE /account/0/workweek', () => {
        it('should return 200 when existing', async () => {
            const response = await request(app)
                .delete('/account/0/workweek')
                .auth(accessToken, { type: 'bearer' })

            expect(response.statusCode).to.eq(200)
        })
    })


    describe('POST /account/0/workweek', () => {
        it('should return 200 and workweek object when none exists', async () => {
            const addWorkweek = [
                {
                    "day": "mon",
                    "start_at": "12:00",
                    "end_at": "20:00"
                },
                {
                    "day": "tue",
                    "start_at": "12:00",
                    "end_at": "20:00"
                },
                {
                    "day": "wed",
                    "start_at": "12:00",
                    "end_at": "20:00"
                },
                {
                    "day": "thu",
                    "start_at": "12:00",
                    "end_at": "20:00"
                },
                {
                    "day": "fri",
                    "start_at": "12:00",
                    "end_at": "20:00"
                },
                {
                    "day": "sun",
                    "start_at": "12:00",
                    "end_at": "20:00"
                },
            ]

            const response = await request(app)
                .post('/account/0/workweek')
                .send({
                    days: addWorkweek
                }
                )
                .auth(accessToken, { type: 'bearer' })

            expect(response.statusCode).to.eq(200)
        })


    })

})


// utility
function sortByDay(a, b) {
    const aInt = +abbrevToDayOfWeek(a.day)
    const bInt = +abbrevToDayOfWeek(b.day)
    return aInt - bInt
}
