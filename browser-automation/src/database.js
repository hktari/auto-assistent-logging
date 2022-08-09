const { Pool } = require('pg')

console.log(`connecting to: ${process.env.PGHOST}:${process.env.PGPORT} DB: ${process.env.PGDATABASE} as ${process.env.PGUSER}`)
const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})


module.exports = {
    db: pool
};