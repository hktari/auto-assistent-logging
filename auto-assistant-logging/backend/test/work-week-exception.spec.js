const { expect } = require('chai')
const request = require('supertest');
const assert = require('assert');
const { abbrevToDayOfWeek } = require('./util.js');

describe('workweek exception', () => {
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

    describe('GET /account/0/workweek-exception', () => {
        it('should 200 and workweek-exception object', async () => {
            const result = [
                {
                    "id": "0",
                    "day": "mon",
                    "date": "2022-08-07",
                    "start_at": "12:00",
                    "end_at": "20:00",
                    "action": "start_btn"
                },
                {
                    "id": "1",
                    "day": "mon",
                    "date": "2022-08-07",
                    "start_at": "12:00",
                    "end_at": "20:00",
                    "action": "stop_btn"
                },
            ]

            const response = await request(app)
                .get('/account/0/workweek-exception')
                .auth(accessToken, { type: 'bearer' })

            expect(response.statusCode).to.eq(200)
            expect(response.body.sort(sortByIdAsc)).to.eql(result.sort(sortByIdAsc))
        })
    })

    describe('POST /account/0/workweek-exception', () => {
        for (const action of ['start_btn', 'stop_btn']) {
            it('should return 200 and workweek-exception object when adding ' + action, async () => {
                const addWorkweekException = {
                    "day": "mon",
                    "date": "2022-10-08",
                    "action": action
                }
                const result = {
                    "date": "2022-10-08",
                    "action": action,
                }

                const response = await request(app)
                    .post('/account/0/workweek-exception')
                    .send(addWorkweekException)
                    .auth(accessToken, { type: 'bearer' })

                expect(response.statusCode).to.eq(200)
                expect(response.body).to.have.property('id')
                expect(response.body.date).to.eql(result.date)
                expect(response.body.action).to.eql(result.action)
            })
        }

        it('should return 500 when date and action matches', async () => {
            const addDuplicateWorkweekException = {
                "day": "mon",
                "date": "2022-10-08",
                "action": 'start_btn'
            }

            const response = await request(app)
                .post('/account/0/workweek-exception')
                .send(addDuplicateWorkweekException)
                .auth(accessToken, { type: 'bearer' })

            expect(response.statusCode).to.eq(500)
        })
    })

    describe('DELETE /account/0/workweek-exception/0', () => {
        it('should return 200 when object exists', async () => {
            const response = await request(app)
                .delete('/account/0/workweek-exception/0')
                .auth(accessToken, { type: 'bearer' })

            expect(response.statusCode).to.eq(200)
        })
    })

})

// utility

// sort by id ASC
function sortByIdAsc(a, b){
    return +a.id - +b.id
}