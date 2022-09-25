
const express = require('express')
const { log, error, info, debug } = require('../util/logging')
const { db } = require('../services/database');
const { loadLoginInfoID } = require('../middleware/common');

const router = express.Router();

router.param('id', loadLoginInfoID);

router.route('/account/:id/workweek-exception')
    .get((req, res, next) => {
        db.query(`SELECT id, action, date, day, start_at, end_at
                FROM work_week_exception wwe JOIN work_week_config wwc ON wwe.work_week_config_id = wwc.id 
                JOIN login_info li ON wwc.login_info_id = li.id
                WHERE li.account_id = $1`, [req.params.id])
            .then(result => {
                res.status(200).json(result.rows)
            })
            .catch(err => next(err))
    })
    .post(async (req, res, next) => {
        const workWeekConfigId = await getWorkweekConfigIDByDay(req.body.day)

        const queryResult = await db.query(`INSERT INTO work_week_exception (work_week_config_id, date, action)
                        VALUES ($1, $2, $3)
                        RETURNING id, date::text, action`, [workWeekConfigId, req.body.date, req.body.action])

        res.sendStatus(queryResult.rowCount > 0 ? 200 : 400)
    })
    .put((req, res, next) => {
        res.sendStatus(404)
    })

router.delete('/account/:id/workweek-exception/:wweid', (req, res, next) => {
    db.query(`DELETE FROM work_week_exception
                    WHERE id=$1`, [req.params.wweid])
        .then(result => res.sendStatus(result.rowCount > 0 ? 200 : 404))
        .catch(err => next(err))
})

async function getWorkweekConfigIDByDay(day) {
    const queryResult = await db.query('SELECT id from work_week_config where day = $1', [day])
    if (queryResult.rowCount > 0) {
        return queryResult.rows[0]
    }
    else {
        throw new Error('Failed to find workweek config for day ' + day)
    }
}

module.exports = router;