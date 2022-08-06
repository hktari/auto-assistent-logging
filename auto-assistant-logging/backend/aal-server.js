'use strict'

require('dotenv').config();

// TODO: setup express with postgres
const express = require('express')
const app = express()
app.use(express.json())

app.get('/', (req, res, next) => {
    res.send('Hello world')
})

const accountRouter = require('./routers/accountRouter')
app.use(accountRouter);

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`)
})