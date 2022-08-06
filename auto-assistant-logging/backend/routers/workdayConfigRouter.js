
const express = require('express')
const { log, error, info, debug } = require('../util/logging')
const { db } = require('../services/database')

const router = express.Router();

function mapFromDTO(dto) {
    try {
        return Object.entries(dto.days).map(val => {
            log(debug(JSON.stringify(val)))
            return {
                day: val[0],
                start_at: val[1].start_at,
                end_at: val[1].end_at
            }
        })
    } catch (err) {
        log(error('Failed to map workweek DTO'))
        log(info(JSON.stringify(dto)))
        throw err;
    }
}

async function getLoginInfoID(id) {
    const queryResult = await db.query(`SELECT li.id FROM login_info li JOIN account a on li.user_id = a.id 
                            WHERE a.id = $1 
                            LIMIT 1`, [id])
    return queryResult.rows[0]?.id
}

router.route('/account/:id/workweek')
    .get((req, res, next) => {
        db.query(`SELECT day, start_at, end_at
                FROM work_week_config wwc JOIN login_info li ON wwc.login_info_id = li.id
                WHERE li.user_id = $1`, [req.params.id])
            .then(result => {
                res.status(200).json(result.rows)
            })
            .catch(err => next(err))
    })
    .post(async (req, res, next) => {

        // note: we don't try/catch this because if connecting throws an exception
        // we don't need to dispose of the client (it will be undefined)
        const client = await db.connect()
        try {
            const workweekConfig = mapFromDTO(req.body)
            log(debug(JSON.stringify(workweekConfig)))

            const loginInfoID = await getLoginInfoID(req.params.id);
            if (loginInfoID === undefined) {
                res.sendStatus(404)
                return;
            }
            log(debug('login info id: ' + loginInfoID))

            await client.query('BEGIN')

            let updateCnt = 0;
            for (let i = 0; i < workweekConfig.length; i++) {
                const configItem = workweekConfig[i];                
                log(debug(JSON.stringify(configItem)))
                const queryResult = await client.query(`INSERT INTO work_week_config (login_info_id, day, start_at, end_at)
                                                        VALUES ($1,$2,$3,$4)`, [loginInfoID, configItem.day, configItem.start_at, configItem.end_at])
                updateCnt += queryResult.rowCount;
            }

            log(debug('updated ' + updateCnt + ' rows in total'))
            await client.query('COMMIT')
            res.sendStatus(200);
        } catch (e) {
            await client.query('ROLLBACK')
            next(e)
        } finally {
            client.release()
        }
    })
    .put((req, res, next) => {

    })
    .delete((req, res, next) => {

    })

module.exports = router;