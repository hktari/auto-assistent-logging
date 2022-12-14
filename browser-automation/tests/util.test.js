const { expect } = require('chai')
const { describe, it } = require('mocha');
const { getEnvVariableOrDefault, abbrevToDayOfWeek } = require('../util/util')

describe('util.js', () => {
    describe('getEnvVariableOrDefault', () => {
        it('should return default when env var is empty string', () => {
            process.env.TIME_TO_EXEC_THRESHOLD_MIN = ''
            expect(getEnvVariableOrDefault('TIME_TO_EXEC_THRESHOLD_MIN', 5)).to.eq(5)
        })

        it('should return default when env var is undefined', () => {
            delete process.env.TIME_TO_EXEC_THRESHOLD_MIN
            expect(getEnvVariableOrDefault('TIME_TO_EXEC_THRESHOLD_MIN', 5)).to.eq(5)
        })

        it('should return environment variable when set', () => {
            process.env.TIME_TO_EXEC_THRESHOLD_MIN = 30
            expect(getEnvVariableOrDefault('TIME_TO_EXEC_THRESHOLD_MIN', 5)).to.eq('30')
        })

    })

    describe('abbrevToDayOfWeek', () => {
        it('should return 0 for sun', () => {
            expect(abbrevToDayOfWeek('sun')).to.eq('0')
        })
        it('should return 1 for mon', () => {
            expect(abbrevToDayOfWeek('mon')).to.eq('1')
        })
        it('should return 6 for sat', () => { 
            expect(abbrevToDayOfWeek('sat')).to.eq('6')
         })
    })
})