const express = require('express')
const chalk = require('chalk')
const { db } = require('../services/database');
const { log, error } = require('../util/logging');

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
    .post(async (req, res, next) => {
        console.log(chalk.gray('[POST] /account'))
        console.log(chalk.gray(JSON.stringify(req.body)))

        try {
            const queryResult = await db.query(`INSERT INTO ACCOUNT (email, password, "automationEnabled")
                                            VALUES ($1, $2, $3);`, [req.body.email, req.body.password, req.body.automationEnabled ?? false])
            if (queryResult.rowCount === 1) {
                res.sendStatus(200)
            }
        } catch (e) {
            next(e)
        }
    })

router.route('/account/:id')
    .get((req, res) => {
        console.log(chalk.gray('[GET] /account/' + req.params.id))
        res.status(200).send('not implemented')
    })
    .delete((req, res) => {
        console.log(chalk.gray('[DELETE] /account/' + req.params.id))
        res.status(200).send('not implemented')
    })
    .put((req, res) => {
        console.log(chalk.gray('[PUT] /account/' + req.params.id))
        res.status(200).send('not implemented')

    })


module.exports = router;