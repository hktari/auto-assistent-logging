
const express = require('express')
const { log, error, info } = require('../util/logging')

/**
 * Updates the workweek config for the given user
 * {
    "timezone": "+0200",
    "days": {
        "mon": {
            "start_at": "14:00",
            "end_at": "22:00"
        },
        "tue": {
            "start_at": "14:00",
            "end_at": "22:00"
        },
        "wed": {
            "start_at": "14:00",
            "end_at": "22:00"
        },
        "thu": {
            "start_at": "14:00",
            "end_at": "22:00"
        },
        "fri": {
            "start_at": "14:00",
            "end_at": "22:00"
        },
        "sat": {
            "start_at": "14:00",
            "end_at": "22:00"
        },
        "sun": {
            "start_at": "14:00",
            "end_at": "22:00"
        }
    }
}
 * @param {string} username 
 * @param {object} weekConfig 
 */
async function updateWorkweek(username, weekConfig) {

}






const router = express.Router()
router.use('/workweek')
    .post(async (req, res) => {
        console.log(chalk.gray('[POST] /workweek'))
    })
    .delete(async (req, res) => {
        console.log(chalk.gray('[DELETE] /workweek'))

    })
    .get(async (req, res) => {
        console.log(chalk.gray('[GET] /workweek'))
    })
