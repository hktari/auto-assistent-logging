
const express = require('express')
const { log, error, info, debug } = require('../util/logging')
const { db } = require('../services/database');
const { loadLoginInfoID } = require('../middleware/common');

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
router.param('id', loadLoginInfoID);

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
        const client = await db.connect()
        try {
            const workweekConfig = mapFromDTO(req.body)
            log(debug(JSON.stringify(workweekConfig)))

            await client.query('BEGIN')

            let updateCnt = 0;
            for (let i = 0; i < workweekConfig.length; i++) {
                const configItem = workweekConfig[i];
                const queryResult = await client.query(`INSERT INTO work_week_config (login_info_id, day, start_at, end_at)
                                                        VALUES ($1,$2,$3,$4)`, [req.loginInfoID, configItem.day, configItem.start_at, configItem.end_at])
                updateCnt += queryResult.rowCount;
            }

            log(debug('added ' + updateCnt + ' rows in total'))
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
        res.sendStatus(404)
    })
    .delete((req, res, next) => {
        db.query(`DELETE FROM work_week_config
                    WHERE login_info_id=$1`, [req.loginInfoID])
            .then(result => res.sendStatus(result.rowCount > 0 ? 200 : 404))
            .catch(err => next(err))
    })

module.exports = router;