const { db } = require('../services/database')
const { log, info, error } = require('../util/logging')

async function loadLoginInfoID(req, res, next) {
    if (!req.params.id) {
        log(error('expected account id. Can\'t load login info id.'))
        next()
        return;
    }
    const queryResult = await db.query(`SELECT li.id FROM login_info li JOIN account a on li.account_id = a.id 
                            WHERE a.id = $1 
                            LIMIT 1`, [req.params.id])
    req.loginInfoID = queryResult.rows[0]?.id
    if (req.loginInfoID === undefined) {
        res.sendStatus(404)
        log(info('login info not found'))
        return;
    } else {
        next()
    }
}


module.exports = {
    loadLoginInfoID
}