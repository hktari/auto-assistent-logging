const express = require('express')
const { createToken, requireAuthentication , requireAdminAuth} = require('../middleware/auth')
const { db } = require('../services/database')
const encrypt = require('../util/encrypt')
const { log, info } = require('../util/logging')
const { route } = require('./accountRouter')
const router = express.Router()

router.post('/login', async (req, res, next) => {
    const queryResult = await db.query(`SELECT id, email, password, "automationEnabled"
                                FROM ACCOUNT
                                WHERE email=$1`, [req.body.email])
    if (queryResult.rowCount === 0) {
        res.sendStatus(400);
    } else {
        const account = queryResult.rows[0]
        if (await encrypt.compare(req.body.password, account.password)) {
            log(info('login succeeded: ' + req.body.email))

            res.status(200).json({
                token: createToken(req.body.email),
                email: account.email,
                automationEnabled: account.automationEnabled
            })
        } else {
            log(info('credentials mismatch'))

            res.status(400).json({
                error: 'Invalid credentials'
            })
        }
    }
})
router.post('/reset-password', requireAuthentication, requireAdminAuth, async (req, res, next) => {
    try {
        
        const queryResult = await db.query(`UPDATE ACCOUNT SET password = $1
                                                WHERE email = $2`, [req.body.password, req.params.id])
        res.sendStatus(queryResult.rowCount > 0 ? 200 : 404);
    } catch (e) {
        next(e)
    }
})


module.exports = router