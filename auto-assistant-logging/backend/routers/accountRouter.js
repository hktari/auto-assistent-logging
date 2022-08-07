const express = require('express')
const chalk = require('chalk')
const { db } = require('../services/database');
const { log, error, info } = require('../util/logging');
const { hash } = require('../util/crypto');

const router = express.Router();

router.route('/account/')
    .get(async (req, res) => {
        console.log(chalk.gray('[GET] /account'))
        try {
            const queryResult = await db.query(`SELECT email, "automationEnabled"
                                                FROM account;`)
            res.status(200).json(queryResult.rows)
        } catch (e) {
            next(e)
        }
    })

router.route('/account/:id')
    .get(async (req, res, next) => {
        console.log(chalk.gray('[GET] /account/' + req.params.id))
        try {
            const queryResult = await db.query(`SELECT email, "automationEnabled"
                                                FROM account WHERE id = $1`, [req.params.id])
            if (queryResult.rowCount > 0) {
                res.status(200).json(queryResult.rows)
            } else {
                res.sendStatus(404);
            }
        } catch (e) {
            next(e)
        }
    })
    .delete(async (req, res, next) => {
        console.log(chalk.gray('[DELETE] /account/' + req.params.id))

        try {
            const queryResult = await db.query('DELETE FROM ACCOUNT WHERE id = $1', [req.params.id])
            res.sendStatus(queryResult.rowCount > 0 ? 200 : 404);
        } catch (e) {
            next(e)
        }
    })
    .put(async (req, res, next) => {
        console.log(chalk.gray('[PUT] /account/' + req.params.id))
        try {
            const queryResult = await db.query(`UPDATE ACCOUNT SET "automationEnabled" = $2
                                            WHERE id = $1`, [req.params.id, req.body.automationEnabled])
            if (queryResult.rowCount > 0) {
                res.sendStatus(200)
            } else {
                log(info('Failed to update account with id: ' + req.params.id))
                res.sendStatus(404);
            }
        } catch (e) {
            next(e)
        }
    })

module.exports = router;