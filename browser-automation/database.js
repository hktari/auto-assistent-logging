const { Pool } = require('pg')

console.log(`connecting to: ${process.env.PGHOST}:${process.env.PGPORT} DB: ${process.env.PGDATABASE} as ${process.env.PGUSER}`)

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000, 
    allowExitOnIdle: true
})
pool.on('connect', _ =>{
    console.log(`connected !`)
})

module.exports = {
    db: pool
};