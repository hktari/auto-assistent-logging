const jwt = require('jsonwebtoken')
const { StatusCode } = require('express');
const { log, info, debug } = require('../util/logging');

function createToken(email, admin = false) {
    const token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * process.env.JWT_EXPIRES_IN_HRS),
        data: { email: email, admin: admin }
    }, process.env.JWT_SECRET);

    return token;
}

function requireAdminAuth(req, res, next) {
    if (req.user?.admin) {
        log(info('admin OK'))
        next()
    } else {
        res.sendStatus(403);
    }
}

function requireAuthentication(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
            if (err) {
                /*
                  err = {
                    name: 'TokenExpiredError',
                    message: 'jwt expired',
                    expiredAt: 1408621000
                  }
                */
                res.status(403).json(err)
            } else {
                log(debug('authorized: ' + decoded.email))
                req.user = decoded;
                next()
            }
        });
    } else {
        res.sendStatus(401)
    }
}

module.exports = {
    createToken,
    requireAuthentication,
    requireAdminAuth
}