const { expect } = require('chai')
const { AUTOMATE_ACTION, CONFIG_TYPE } = require('../interface')
const { AutomationAction, AutomationActionResult, THRESHOLD_MINUTES } = require('../util/actions')

describe('actions.js', () => {
    describe('timeToExecute()', () => {
        const datetime = new Date(Date.UTC(2022, 7, 18, 20, 0))
        let action;

        beforeEach(() => {
            action = new AutomationAction(null, AUTOMATE_ACTION.START_BTN, CONFIG_TYPE.DAILY, datetime)
        })

        it('should return false when time is greater and outside threshold', () => {
            const datetimeOutside = new Date(datetime)
            datetimeOutside.setUTCMilliseconds(datetimeOutside.getUTCMilliseconds() + (THRESHOLD_MINUTES * 60 * 1000) + 1)

            expect(action.timeToExecute(datetimeOutside)).to.be.false
        })

        it('should return true when time is greater and within threshold', () => {
            const datetimeThreshold = new Date(datetime)
            datetimeThreshold.setUTCMinutes(datetime.getUTCMinutes() + THRESHOLD_MINUTES)

            expect(action.timeToExecute(datetimeThreshold)).to.be.true
        })

        it('should return false when time is less', () => {
            const datetimeLess = new Date(datetime)
            datetimeLess.setUTCHours(datetimeLess.getUTCHours() - 1)

            expect(action.timeToExecute(datetimeLess)).to.be.false
        })

        it('should return true when times are equal', () => {
            expect(action.timeToExecute(datetime)).to.be.true
        })
    })
})