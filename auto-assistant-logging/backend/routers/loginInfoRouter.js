const express = require('express')
const { log, error, info } = require('../util/logging')
const { db } = require('../services/database')

const router = express.Router()

router.route('/account/:id/login-info')
    .get((req, res, next) => {
        log(info('[GET] login info'))

        db.query(`SELECT a.id, email, li.username, li.password 
                    FROM login_info li JOIN account a ON li.user_id = a.id
                    WHERE a.id = $1`, [req.params.id])
            .then(result => res.status(result.rowCount > 0 ? 200 : 404).json(result.rows))
            .catch(err => next(err))
    })
    .post((req, res, next) => {
        // todo: encrypt password
        db.query(`INSERT INTO login_info (user_id, username, password)
                    VALUES($1, $2, $3)`, [req.params.id, req.body.username, req.body.password])
            .then(result => res.status(200).json(result.rows))
            .catch(err => next(err))
    })
    .put((req, res, next) => {
        // todo: encrypt password
        db.query(`UPDATE login_info SET username = $1, password = $2
                    WHERE user_id = $3`, [req.body.username, req.body.password, req.params.id])
            .then(result => {
                res.sendStatus(result.rowCount > 0 ? 200 : 404)
            })
            .catch(err => next(err))
    })
    .delete((req, res, next) => {
        db.query(`DELETE FROM login_info WHERE user_id = $1`, [req.params.id])
            .then(result => res.sendStatus(result.rowCount > 0 ? 200 : 404))
            .catch(err => next(err))
    })

module.exports = router;