/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         msg:
 *           type: string
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 */

const authService = require("../services/authService");
const utils = require("../utils/helperFunction");
const config = require('../config/config');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
/**
 * @swagger
 * /user/health:
 *   get:
 *     summary: Check API health
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Health check successful
 */
const gethealth = (req, res) => {
    res.send("hello users");
};
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing required fields or invalid OTP
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
const register = async (req, res) => {

   

    try {
        const { name, email, password, role, otp } = req.body;

        const existingUser = await authService.isExist(email);
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
        console.log("otp is :"+otp)

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

        const newUser = await authService.createNewUser(userPayload);

        return res.status(201).json({
            user: newUser,
            msg: "User created successfully",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Internal server error" });
    }
};
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
const login = async (req, res) => {

    try {
        const { email, password } = req.body;

        const user = await authService.isExist(email);
        if (!user) {
        return res.status(401).json({error: "Invalid email or password",
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

