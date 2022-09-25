const { expect } = require('chai')
const request = require('supertest');
const assert = require('assert');

describe('workday config', () => {
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


    describe('POST /login', () => {
        it('should return 200 and access token', async () => {
            const response = await request(app)
                .post('/login')
                .send({ email: 'existing.user@example.com', password: 'secret' })
            expect(response.statusCode).to.eq(200)
            expect(response.body.token).to.exist
        })
    })

    describe('GET /workday-config', () => {
        it('should should return 200 and a workday object', async () => {
            const result = [{
                id: "0",
                date: "2022-08-08",
                start_at: '12:00',
                end_at: '20:00'
            }]

            const response = await request(app)
                .get('/account/0/workday')
                .auth(accessToken, { type: 'bearer' })

            expect(response.status).to.eq(200)
            expect(response.body).to.eql(result)
        })
    })

})