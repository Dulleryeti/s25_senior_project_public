const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
    const token = req.header("Authorization");

    if (!token)
        return res
            .status(403)
            .json({ message: "Access denied, not authenticated" });

    try {
        const verified = jwt.verify(
            token.replace("Bearer ", ""),
            process.env.JWT_SECRET
        );
        req.user = verified; // Attach decoded user data
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res
                .status(403)
                .json({ message: "Forbidden: Insufficient permissions" });
        }
        next();
    };
}

module.exports = { verifyToken, requireRole };
