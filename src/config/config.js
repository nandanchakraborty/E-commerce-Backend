require('dotenv').config();  

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH = process.env.JWT_REFRESH;
const EMAILUSER = process.env.EMAILUSER;
const EMAILPASSWORD = process.env.EMAILPASSWORD;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

module.exports = {
  JWT_REFRESH,
  JWT_SECRET,
  EMAILPASSWORD,
  EMAILUSER,
  GOOGLE_CLIENT_ID,
  CLIENT_SECRET
};