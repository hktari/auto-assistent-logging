const express = require('express')
const { log, error, info } = require('../util/logging')
const { db } = require('../services/database')
const { encrypt } = require('../util/crypto')

const router = express.Router()

router.route('/account/:id/login-info')
    .get((req, res, next) => {
        log(info('[GET] login info'))

        db.query(`SELECT a.id, email, li.username, li.password_cipher, li.iv_cipher 
                    FROM login_info li JOIN account a ON li.account_id = a.id
                    WHERE a.id = $1`, [req.params.id])
            .then(result => res.status(result.rowCount > 0 ? 200 : 404).json(result.rows))
            .catch(err => next(err))
    })
    .post(async (req, res, next) => {
        try {
            const pwdCipher = encrypt(req.body.password)
            const queryResult = await db.query(`INSERT INTO login_info (account_id, username, password_cipher, iv_cipher)
                                                VALUES($1, $2, $3, $4)`, [req.params.id, req.body.username, pwdCipher.cipherText, pwdCipher.iv])
            res.status(200)
        } catch (err) {
            next(err)
        }
    })
    .put(async (req, res, next) => {
        try {
            const pwdCipher = encrypt(req.body.password)
            const queryResult = await db.query(`UPDATE login_info SET username = $1, password_cipher = $2, iv_cipher = $3
                                            WHERE account_id = $4`, [req.body.username, pwdCipher.cipherText, pwdCipher.iv, req.params.id])

            res.sendStatus(queryResult.rowCount > 0 ? 200 : 404)
        } catch (err) {
            next(err)
        }
    })
    .delete((req, res, next) => {
        db.query(`DELETE FROM login_info WHERE account_id = $1`, [req.params.id])
            .then(result => res.sendStatus(result.rowCount > 0 ? 200 : 404))
            .catch(err => next(err))
    })

module.exports = router;