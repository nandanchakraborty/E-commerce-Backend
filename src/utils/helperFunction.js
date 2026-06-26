const {
	JWT_SECRET,
	SECRET,
	JWT_REFRESH,
	EMAILUSER,
	EMAILPASSWORD,
	GOOGLE_CLIENT_ID,
	CLIENT_SECRET,
} = require("../config/config");

const speakeasy = require("speakeasy");
const nodemailer = require("nodemailer");

function getUserSecret(email) {
	return `${SECRET}_${email}`;
}

function generateOTP(email) {
	return speakeasy.totp({
		secret: getUserSecret(email),
		encoding: "ascii",
	});
}

function verifyOTP(email, token) {
	return speakeasy.totp.verify({
		secret: getUserSecret(email),
		encoding: "ascii",
		token: token,
		window: 2, // Handles minor time-drifts (allows up to 60 seconds before/after)
	});
}

async function sendOTPEmail(email, otp) {
	const transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: EMAILUSER,
			pass: EMAILPASSWORD,
		},
	});

	await transporter.sendMail({
		from: `"OTP Service" <${EMAILUSER}>`,
		to: email,
		subject: "Your Verification Code",
		text: `Hello,
			Your verification code is: ${otp}
			This code expires in 5 minutes.
			If you did not request this code, please ignore this email.`,
	});
}

module.exports = {
	getUserSecret,
	generateOTP,
	verifyOTP,
	sendOTPEmail,
};
