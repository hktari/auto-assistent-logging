const jwt = require('jsonwebtoken')



function createToken(email, admin = false) {
    const token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * process.env.JWT_EXPIRES_IN_HRS),
        data: { email: email, admin: admin }
    }, process.env.JWT_SECRET);

    // const token = jwt.sign(,
    //     process.env.JWT_SECRET,
    //     {
    //         expiresIn: ,
    //     });
    return token;
}


function requireAuthorization(req, res, next) {

}

module.exports ={
    createToken,
    requireAuthorization
}