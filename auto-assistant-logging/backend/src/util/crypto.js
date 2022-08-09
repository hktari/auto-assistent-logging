const bcrypt = require('bcrypt');
const saltRounds = 10;

function hash(text) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(text, saltRounds, function (err, hash) {
            if (err) {
                reject(err)
            } else {
                resolve(hash)
            }
        });
    })
}
function compare(text, hash) {
    return bcrypt.compare(text, hash);
}

const crypto = require('node:crypto');
const { resolve } = require('node:path');
const { log, info, debug, warning } = require('./logging');

function loadKey() {
    const key = process.env.CRYPTO_KEY
    if (!key) {
        throw new Error('crypto key missing')
    }

    log(debug(key))
    return key
}

function encrypt(text) {
    //
    // AES Symmetric Encryption in node.js
    //

    log(debug('encryption...'))


    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto.createHash('sha256').update('myHashedIV').digest();
    iv.copy(resizedIV);

    const key = loadKey()
    const keyBuffer = crypto.createHash('sha256').update(key).digest();

    const cipher = crypto.createCipheriv('aes256', keyBuffer, resizedIV);
    const msg = [];

    msg.push(cipher.update(text, 'utf8', 'hex'));

    msg.push(cipher.final('hex'));

    // I would need to send both the IV and the Encrypted text to my friend
    // { iv: initializationVector.toString('base64')
    // , cipherText: encrypted
    // }
    log(debug('finished !'))

    return { cipherText: msg.join(''), iv: resizedIV.toString('hex') }
}

function decrypt(iv, cipherText) {
    log(debug('decrypting...'))
    const key = loadKey()
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    const ivBuffer = Buffer.from(iv, encoding = 'hex');
    const decipher = crypto.createDecipheriv('aes256', keyBuffer, ivBuffer);
    const msg = [];

    msg.push(decipher.update(cipherText, 'hex', 'utf8'));

    msg.push(decipher.final('utf8'));

    log(debug('done!'))
    return msg.join('')
}

module.exports = {
    hash,
    compare,
    encrypt,
    decrypt
}