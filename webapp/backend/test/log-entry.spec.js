const { expect } = require('chai')
const request = require('supertest');
const { abbrevToDayOfWeek } = require('./util.js');

describe('log entry', () => {
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

    describe('GET /account/0/log-entry', () => {
        it('should return an array of log entry objects', async () => {
            const result = [
                {
                    "id": "1",
                    "status": 'successful',
                    "timestamp": '2022-08-01 14:00:00',
                    "error": null,
                    "message": 'Sucessfully executed start_btn action',
                    "action": 'start_btn',
                    "config_type": 'CONFIG_TYPE_WEEKLY'
                },
                {
                    "id": "2",
                    "status": 'successful',
                    "timestamp": '2022-08-01 22:00:00',
                    "error": null,
                    "message": 'Sucessfully executed stop_btn action',
                    "action": 'stop_btn',
                    "config_type": 'CONFIG_TYPE_WEEKLY'
                },
                {
                    "id": "3",
                    "status": 'failed',
                    "timestamp": '2022-08-02 14:00:00',
                    "error": 'Failed to execute start_btn action',
                    "message": null,
                    "action": 'start_btn',
                    "config_type": 'CONFIG_TYPE_DAILY'
                },
            ]

            const response = await request(app)
                .get('/account/0/log-entry')
                .auth(accessToken, { type: 'bearer' })

            expect(response.statusCode).to.eq(200)
            expect(response.body.sort(sortByIdAsc)).to.eql(result.sort(sortByIdAsc))
        })
    })

    describe('DELETE /account/0/log-entry/1', () => {
        it('should return 401 when no access token', async () => {
            const response = await request(app)
                .delete('/account/0/log-entry/1')

            expect(response.statusCode).to.eq(401)
        })

        it('should return 200 when deleting existing record', async () => {
            const response = await request(app)
                .delete('/account/0/log-entry/1')
                .auth(accessToken, { type: 'bearer' })

            expect(response.statusCode).to.eq(200)
        })
    })

    describe('DELETE /account/0/log-entry/all', () => {
        it('should return 401 when no access token', async () => {
            const response = await request(app)
                .delete('/account/0/log-entry/all')

            expect(response.statusCode).to.eq(401)
        })

        it('should return 200 and return deleted row count', async () => {
            const result = { deletedCount: 2 }
            const response = await request(app)
                .delete('/account/0/log-entry/all')
                .auth(accessToken, { type: 'bearer' })

            expect(response.statusCode).to.eq(200)
            expect(response.body).to.eql(result)
        })
    })
})


// utility
function sortByDay(a, b) {
    const aInt = +abbrevToDayOfWeek(a.day)
    const bInt = +abbrevToDayOfWeek(b.day)
    return aInt - bInt
}
function sortByIdAsc(a, b) {
    return +a.id - +b.id
}