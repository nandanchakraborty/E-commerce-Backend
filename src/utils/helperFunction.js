const {JWT_SECRET,SECRET,JWT_REFRESH,EMAILUSER,EMAILPASSWORD,GOOGLE_CLIENT_ID,CLIENT_SECRET} = require('../config/config')

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
		subject: "Your OTP Code",
		text: `Your OTP code is: ${otp}`,
	});
}

module.exports={
    getUserSecret,
    generateOTP,
    verifyOTP,
    sendOTPEmail,
}