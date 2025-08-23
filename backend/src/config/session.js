const session = require("express-session");

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET nije definisan u .env fajlu");
}

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8, // 8 sati
    path: "/api/admin",
  },
};

module.exports = sessionConfig;
