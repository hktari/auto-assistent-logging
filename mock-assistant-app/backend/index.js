require('dotenv').config()

// server.js
const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()
const cors = require('cors')

server.use(cors())
server.use(middlewares)
server.use(router)
server.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`JSON Server is running on http://${process.env.HOST}:${process.env.PORT}`)
})