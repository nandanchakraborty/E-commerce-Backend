const cors = require('cors');
const express = require('express');
require('dotenv').config();

const app = express();
const userHandler = require('./routes/userRoutes')

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user',userHandler);

module.exports = app;