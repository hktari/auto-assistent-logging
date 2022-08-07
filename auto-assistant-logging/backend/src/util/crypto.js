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
const { log, info, debug, warning } = require('./logging');

function loadKeyBytes() {
    const key = process.env.CRYPTO_KEY
    if (!key) {
        throw new Error('crypto key missing')
    }

    log(debug(key))
    return Buffer.from(key, 'base64')
}

function encrypt(text) {
    //
    // AES Symmetric Encryption in node.js
    //

    const sharedSecret = loadKeyBytes(); // should be 128 (or 256) bits
    const initializationVector = crypto.randomBytes(16); // IV is always 16-bytes
    let encrypted = '';

    const cipher = crypto.createCipheriv('aes-128-cbc', sharedSecret, initializationVector);
    encrypted += cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // I would need to send both the IV and the Encrypted text to my friend
    // { iv: initializationVector.toString('base64')
    // , cipherText: encrypted
    // }
    return { iv: initializationVector, cipherText: encrypted }
}

function decrypt(iv, cipherText) {
    const key = loadKeyBytes(); // should be 128 (or 256) bits
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);

    // Encrypted using same algorithm, key and iv.
    let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    log(warning(decrypted))

    return decrypted;
}

module.exports = {
    hash,
    compare,
    encrypt,
    decrypt
}