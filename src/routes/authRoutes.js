const express = require('express')
const router = express.Router();
const authController = require('../controllers/authController');
const {registerSchema,loginSchema} = require('../validators/authValidators')
const validate = require('../middleware/validationMiddleware')
router.get('/health',authController.gethealth);

router.post('/register',validate(registerSchema),authController.register);

router.post('/login',validate(loginSchema),authController.login);

module.exports = router;