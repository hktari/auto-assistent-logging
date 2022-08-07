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

module.exports = {
    hash,
    compare
}