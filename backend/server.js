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

  app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
  }));  

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      store: new PgStore({
        pool: pool,
        conString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: false, 
        httpOnly: true
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use("/api/auth", userRoutes);

  app.get("/", (req, res) => {
    res.send("API is running...");
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();
