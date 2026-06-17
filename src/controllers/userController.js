const router = require('../routes/userRoutes');
const userService = require('../services/userService')
const  utils = require('../utils/helperFunction')
const bcrypt = require('bcrypt');
const gethealth = (req,res) =>{
    res.send("hello users");
}
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
module.exports = {
    gethealth,
    register,
}