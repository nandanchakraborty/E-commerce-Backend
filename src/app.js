const cors = require('cors');
const express = require('express');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const userHandler = require('./routes/userRoutes')
const adminHandler = require('./routes/adminRoutes')

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/user',userHandler);
app.use('/admin',adminHandler);

module.exports = app;
