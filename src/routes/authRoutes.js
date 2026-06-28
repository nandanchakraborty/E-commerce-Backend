const express = require('express')
const router = express.Router();
const authController = require('../controllers/authController')
const { userMiddleware} = require('../middleware/authMiddleware')
const {registerSchema,loginSchema} = require('../validators/authValidators')
const validate = require('../middleware/validationMiddleware')
router.get('/health',authController.gethealth);

router.post('/register',validate(registerSchema),authController.register);

router.post('/login',validate(loginSchema),authController.login);
router.post(
    "/logout",
    userMiddleware,
    authController.logout
);
module.exports = router;