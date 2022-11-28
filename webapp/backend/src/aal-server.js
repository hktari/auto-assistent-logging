const express = require('express');
const { requireAuthentication } = require('./middleware/auth');
const app = express()
app.use(express.json())
const { debug, log, error, info } = require('./util/logging')

function logger(req, res, next) {
    log(info(`[${req.method}] ${req.originalUrl}`))
    next()
}
app.use(logger);

app.get('/', (req, res, next) => {
    res.send('Hello world')
})


app.use(require('./routers/authRouter'))


app.use(requireAuthentication, require('./routers/accountRouter'));
app.use(require('./routers/loginInfoRouter'));
app.use(require('./routers/workweekConfigRouter'))
app.use(require('./routers/workdayConfigRouter'))
app.use(require('./routers/workweekExceptionRouter'))
app.use(require('./routers/logEntryRouter'))

function errorHandler(err, req, res, next) {
    res.status(500)
    res.json({ error: err })
}

app.use(errorHandler)


module.exports = app