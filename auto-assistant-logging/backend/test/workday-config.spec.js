const { expect } = require('chai')
const request = require('supertest');
const assert = require('assert');

describe('workday config', () => {
    let app;
    beforeAll(() => {
        app = require('../src/aal-server.js')

    })

    describe('GET /workday-config', () => {
        it('should should return 200 and a workday object', async () => {
            const response = await request(app).get('/account/:id/workday')
            expect(response.status).to.eq(200)
        })
    })

})