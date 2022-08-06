const express = require('express')
const { loadLoginInfoID } = require('../middleware/common')
const { db } = require('../services/database')
const { log, error, info, debug } = require('../util/logging')

const router = express.Router()

router.param('id', loadLoginInfoID);

router.route('/account/:id/workday')
    .post((req, res, next) => {
        log(debug(req.loginInfoID))
        db.query(`INSERT INTO daily_config (login_info_id, date, start_at, end_at, automation_type)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *`, [req.loginInfoID, req.body.date, req.body.start_at, req.body.end_at, req.body.automation_type])
            .then(result => res.status(result.rowCount > 0 ? 200 : 400).json(result.rows))
            .catch(err => next(err))
    })

module.exports = router;