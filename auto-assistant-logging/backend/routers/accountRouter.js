const express = require('express')
const chalk = require('chalk')

const router = express.Router();

router.route('/account/')
    .get((req, res) => {
        console.log(chalk.gray('[GET] /account'))
        res.status(200).send('not implemented')
    })
    .post((req, res) => {
        console.log(chalk.gray('[POST] /account'))
        console.log(chalk.gray(JSON.stringify(req.body)))
        res.status(200).send('not implemented')
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