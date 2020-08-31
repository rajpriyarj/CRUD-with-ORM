const jwt = require('jsonwebtoken');

const checkToken = (req, res, next) => {
    const bearerHeader = req.headers.authorization;
    if (typeof bearerHeader === "undefined"){
        res.json({
            "error":"Token Invalid"
        })
    } else {
        let bearerToken = bearerHeader.split(' ')[1];
        let authData = verifyToken(res, next, bearerToken);
    }
};

let salt = 'ZGV2c25lc3QK';

const verifyToken = (res, next, token) => {
    let data = jwt.verify(token, salt, (err, authData) => {
        if (err) {
            res.json({error: "Invalid token."});
        } else {
            next();
        }
    });
};

module.exports = {
    checkToken
};