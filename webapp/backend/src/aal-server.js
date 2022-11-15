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


module.exports = app