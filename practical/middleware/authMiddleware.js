const authMiddleware = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.json({
            status: 403,
            msg: "403 Access Denied"
        })
    }
    const token = req.headers.authorization.split(" ")[1];
    req.user = token;
    next()
}

module.exports = authMiddleware;