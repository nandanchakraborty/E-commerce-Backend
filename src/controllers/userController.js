const router = require("../routes/userRoutes");
const userService = require("../services/userService");
const utils = require("../utils/helperFunction");
const config = require('../config/config')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gethealth = (req, res) => {
	res.send("hello users");
};
const register = async (req, res) => {
	const { name, email, password, role, otp } = req.body;

	if (!name || !email || !password || !role) {
		return res.status(400).json({ msg: "Missing required fields" });
	}

	try {
		const existingUser = await userService.isExist(email);
		if (existingUser) {
			return res.status(409).json({ msg: "User already exists" });
		}

		if (!otp) {
			const generatedOtp = utils.generateOTP(email);
			await utils.sendOTPEmail(email, generatedOtp);

			return res.status(200).json({
				msg: "OTP sent to email",
			});
		}

		const isVerified = utils.verifyOTP(email, otp);
		if (!isVerified) {
			return res.status(400).json({ msg: "Invalid or expired OTP" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const userPayload = {
			name,
			email,
			role,
			password: hashedPassword,
		};

		const newUser = await userService.createNewUser(userPayload);

		return res.status(201).json({
			user: newUser,
			msg: "User created successfully",
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ msg: "Internal server error" });
	}
};

const login = async (req, res) => {
  const { email, password } = req.body;

	try {
		if (!email || !password) {
			return res.status(400).json({
				error: "Email and password are required.",
			});
		}

		const user = await userService.isExist(email);

		if (!user || !user.password) {
			return res.status(401).json({
				error: "Invalid email or password",
			});
		}

		const isMatch = await bcrypt.compare(password, user.password);

		if (isMatch) {
			const accessToken = jwt.sign(
				{ userId: user.id, role: user.role },
				  config.JWT_SECRET,
				{ expiresIn: "1h" },
			);

			const refreshToken = jwt.sign(
				{ userId: user.id, role: user.role },
				  config.JWT_REFRESH,
				{ expiresIn: "7d" },
			);

			return res.status(200).json({
				msg: "login successful",
				accessToken,
				refreshToken,
			});
		} else {
			return res.status(401).json({ error: "Invalid email or password" });
		}
	} catch (err) {
		console.error("Login error details:", err.message);
		return res.status(500).json({ error: "Internal server error" });
	}

};



























module.exports = {
	gethealth,
	register,
  login,

};
