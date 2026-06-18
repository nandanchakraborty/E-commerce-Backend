const cors = require('cors');
const express = require('express');
require('dotenv').config();

const app = express();
const userHandler = require('./routes/userRoutes')
const adminHandler = require('./routes/adminRoutes')

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user',userHandler);
app.use('/admin',adminHandler);

module.exports = app;