const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    try {

        let token = req.headers.authorization;

        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Access Denied"
            });

        }

        token = token.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    }

    catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }

};