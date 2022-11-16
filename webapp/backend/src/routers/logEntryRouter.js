const express = require('express')
const chalk = require('chalk')
const { db } = require('../services/database');
const { log, error, info } = require('../util/logging');
const { loadLoginInfoID } = require('../middleware/common')

const router = express.Router();

router.param('id', loadLoginInfoID);

router.route('/account/:id/log-entry')
    .get((req, res, next) => {
        db.query(`SELECT    le.id,
                            "status",
                            timestamp::text,
                            "error",
                            "message",
                            "action",
                            "config_type"
                    FROM log_entry le JOIN login_info li ON le.login_info_id = li.id 
                    WHERE li.id = $1
                    ORDER BY le.timestamp DESC`, [req.loginInfoID])
            .then(result => res.status(200).json(result.rows))
            .catch(err => next(err))
    })

router.delete('/account/:id/log-entry/all', (req, res, next) => {
    db.query(`DELETE FROM log_entry le
            WHERE le.login_info_id in (
                SELECT li.id from login_info li
                WHERE li.id = $1
                )`, [req.loginInfoID])
        .then(result => {
            res.status(200).json({
                deletedCount: result.rowCount
            })
        })
        .catch(err => next(err))
})

router.route('/account/:id/log-entry/:logEntryId')
    .delete((req, res, next) => {
        db.query(`DELETE FROM log_entry
                            WHERE id = $1`, [req.params.logEntryId])
            .then(result => res.sendStatus(result.rowCount > 0 ? 200 : 404))
            .catch(err => next(err))
    })

module.exports = router;