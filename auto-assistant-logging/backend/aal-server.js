'use strict'

require('dotenv').config();

// TODO: setup express with postgres
const express = require('express')
const app = express()
app.use(express.json())
const { log, error } = require('./util/logging')

// router.all('*', requireAuthentication, loadUser)

app.get('/', (req, res, next) => {
    res.send('Hello world')
})

app.use(require('./routers/accountRouter'));
app.use(require('./routers/loginInfoRouter'));

function logErrors(err, req, res, next) {
    log(error(err.stack))
    next(err)
}
function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
        res.status(500).send({ error: 'Something failed!' })
    } else {
        next(err)
    }
}

app.use(logErrors);
app.use(clientErrorHandler);

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`)
})

