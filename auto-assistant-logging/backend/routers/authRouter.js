const express = require('express')
const { createToken } = require('../middleware/auth')
const { db } = require('../services/database')
const encrypt = require('../util/encrypt')
const { log, info } = require('../util/logging')
const { route } = require('./accountRouter')
const router = express.Router()

router.post('/login', (req, res, next) => {
    const queryResult = db.query(`SELECT id, email, password
                                FROM ACCOUNT
                                WHERE email=$1`, [req.body.email])
    if (queryResult.rowCount === 0) {
        res.sendStatus(400);
    } else {
        const account = queryResult.rows[0]
        if (encrypt.compare(req.body.password, account.password)) {
            log(info('login succeeded: ' + req.body.email))

            res.status(200).json({
                token: createToken(req.body.email),
                ...account
            })
        } else {
            log(info('credentials mismatch'))

            res.status(400).json({
                error: 'Invalid credentials'
            })
        }
    }
})

module.exports = router