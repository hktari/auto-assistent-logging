const express = require('express')
const { log, error, info, debug } = require('../util/logging')
const { db } = require('../services/database')
const { encrypt, decrypt } = require('../util/crypto')

const router = express.Router()

router.route('/account/:id/login-info')
    .get((req, res, next) => {
        log(info('[GET] login info'))

        db.query(`SELECT a.id, email, li.username, 
                    encode(li.password_cipher, 'hex') as password_cipher, encode(li.iv_cipher, 'hex') as iv_cipher 
                    FROM login_info li JOIN account a ON li.account_id = a.id
                    WHERE a.id = $1`, [req.params.id])
            .then(result => {
                if (result.rowCount > 0) {
                    res.status(200).json(result.rows[0])
                } else {
                    res.status(404)
                }
            })
            .catch(err => next(err))
    })
    .post(async (req, res, next) => {
        try {
            const pwdCipher = encrypt(req.body.password)
            const queryResult = await db.query(`INSERT INTO login_info (account_id, username, password_cipher, iv_cipher)
                                                VALUES($1, $2, decode($3, 'hex'), decode($4, 'hex'))`, [req.params.id, req.body.username, pwdCipher.cipherText, pwdCipher.iv])
            res.sendStatus(200)
        } catch (err) {
            next(err)
        }
    })
    .put(async (req, res, next) => {
        try {
            const pwdCipher = encrypt(req.body.password)
            const queryResult = await db.query(`UPDATE login_info SET username = $1, 
                                            password_cipher = decode($2, 'hex'), iv_cipher = decode($3, 'hex')
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