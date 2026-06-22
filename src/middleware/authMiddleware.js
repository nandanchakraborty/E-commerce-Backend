const jwt = require('jsonwebtoken');
const config = require('../config/config')


const authorize = (requiredRole) => {
	return (req, res, next) => {
		try {
			const { authorization } = req.headers;

			if (!authorization) {
				return res.status(401).json({
					error: "No token provided",
				});
			}

			const token = authorization.split(" ")[1];

			if (!token) {
				return res.status(401).json({
					error: "Invalid token format",
				});
			}

			const decoded = jwt.verify(
				token,
				config.JWT_SECRET
			);

			const { userId, role } = decoded;

			if (role !== requiredRole) {
				return res.status(403).json({
					error: `Access denied. ${requiredRole} role required.`,
				});
			}

			req.userId = userId;
			req.role = role;

			next();
		} catch (err) {
			console.error("Auth middleware error:", err.message);

			return res.status(401).json({
				error: "Authentication failed",
			});
		}
	};
};

const userMiddleware = authorize("user");
const adminMiddleware = authorize("ADMIN");

module.exports = {
	userMiddleware,
	adminMiddleware,
};
