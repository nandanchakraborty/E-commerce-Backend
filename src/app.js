const cors = require('cors');
const express = require('express');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const app = express();
const authHandler = require('./routes/authRoutes');
const adminHandler = require('./routes/adminRoutes');
const userHandler = require('./routes/userRoutes')
const userController = require('./controllers/userController')

const path = require("path");

app.use(express.static(path.join(__dirname, "../public")));
app.use(cors());

app.post(
	"/user/webhook",
	express.raw({
		type: "application/json",
	}),
	userController.webhook,
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth',authHandler);
app.use('/admin',adminHandler);
app.use('/user',userHandler);

module.exports = app;
