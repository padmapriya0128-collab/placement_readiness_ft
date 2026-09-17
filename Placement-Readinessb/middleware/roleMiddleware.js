module.exports = (...roles) => {

    return (req, res, next) => {

        if (!req.user || !req.user.role) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized"

            });

        }

        const userRole = req.user.role.toLowerCase();

        const allowedRoles = roles.map(role => role.toLowerCase());

        if (!allowedRoles.includes(userRole)) {

            return res.status(403).json({

                success: false,

                message: "Access Forbidden"

            });

        }

        next();

    };

};