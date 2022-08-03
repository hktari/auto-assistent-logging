const { Client } = require('pg')


async function query(statement, values = []) {
    const client = new Client()
    await client.connect()
    // const res = await client.query('SELECT $1::text as message', ['Hello world!'])
    const res = await client.query(statement, values)
    await client.end()
    return res;
}

module.exports = {
    query
};