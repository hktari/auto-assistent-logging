const { Client } = require('pg')

async function query(statement, values = []) {
    console.log(`connecting to: ${process.env.PGHOST}:${process.env.PGPORT} DB: ${process.env.PGDATABASE} as ${process.env.PGUSER}`)
    const client = new Client({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT,
    })    
    await client.connect()
    // const res = await client.query('SELECT $1::text as message', ['Hello world!'])
    const res = await client.query(statement, values)
    await client.end()
    return res;
}

module.exports = {
    query
};