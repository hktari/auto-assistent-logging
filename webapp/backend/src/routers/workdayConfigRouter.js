const express = require('express')
const { loadLoginInfoID } = require('../middleware/common')
const { db } = require('../services/database')
const { log, error, info, debug } = require('../util/logging')

const router = express.Router()

router.param('id', loadLoginInfoID);

router.route('/account/:id/workday')
    .get((req, res, next) => {
        db.query(`SELECT dc.id, date::text, start_at, end_at
                    FROM daily_config dc JOIN login_info li ON dc.login_info_id = li.id 
                    WHERE li.id = $1`, [req.loginInfoID])
            .then(result => res.status(200).json(result.rows))
            .catch(err => next(err))
    })
    .post((req, res, next) => {
        log(debug(req.loginInfoID))
        db.query(`INSERT INTO daily_config (login_info_id, date, start_at, end_at)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id, login_info_id, date::text, start_at, end_at`, [req.loginInfoID, req.body.date, req.body.start_at, req.body.end_at])
            .then(result => res.status(result.rowCount > 0 ? 200 : 400).json(result.rows))
            .catch(err => next(err))
    })

router.route('/account/:id/workday/:workdayId')
    .delete((req, res, next) => {
        db.query(`DELETE FROM daily_config
                            WHERE id = $1`, [req.params.workdayId])
            .then(result => res.sendStatus(result.rowCount > 0 ? 200 : 404))
            .catch(err => next(err))
    })

module.exports = router;