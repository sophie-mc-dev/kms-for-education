require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const userRoutes = require("./routes/userRoutes");
const { pool } = require("./db/db");
const PgStore = require("connect-pg-simple")(session);
const cors = require("cors");

const app = express();
const port = process.env.PORT;

const { testConnection } = require('./db/db');

async function startServer() {
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("Database connection failed. Exiting...");
    process.exit(1);
  }

  // CORS Configuration
  app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
  }));  

  // Body Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session Configuration (In-Memory)
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
        secure: false, 
        httpOnly: true
      }
    })
  );

  // Passport.js Initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use("/api/auth", userRoutes);

  app.get("/", (req, res) => {
    res.send("API is running...");
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();
