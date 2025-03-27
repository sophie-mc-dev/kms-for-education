require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const authenticationRoutes = require("./routes/authenticationRoutes");
const usersRoutes = require("./routes/usersRoutes");
const resourcesRoutes = require("./routes/resourcesRoutes");
const bookmarksRoutes = require("./routes/bookmarksRoutes");
const learningPathsRoutes = require("./routes/learningPathsRoutes");
const modulesRoutes = require("./routes/modulesRoutes");
const userInteractionsRoutes = require("./routes/userInteractionsRoutes")
const cors = require("cors");

const app = express();
const port = process.env.PORT;

const { testPostgresConnection } = require("./db/postgres"); // PostgreSQL
const { testNeo4jConnection } = require("./db/neo4j"); // Neo4j
const { syncData } = require("./db/sync_pg_to_neo4j");

async function startServer() {
  const isPostgresConnected  = await testPostgresConnection();
  const isNeo4jConnected = await testNeo4jConnection();

  if (!isPostgresConnected || !isNeo4jConnected) {
    console.error("Database connection failed. Exiting...");
    process.exit(1);
  }

  // **Sync data from PostgreSQL to Neo4j**
  console.log("Syncing data from PostgreSQL to Neo4j...");
  await syncData(); // Call sync function

  // CORS Configuration
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

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
        secure: false,
        httpOnly: true,
      },
    })
  );

  // Passport.js Initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use("/api/auth", authenticationRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/resources", resourcesRoutes);
  app.use("/api/bookmarks", bookmarksRoutes);
  app.use("/api/user-interactions", userInteractionsRoutes);
  app.use("/api/learning-paths", learningPathsRoutes);
  app.use("/api/modules", modulesRoutes);

  app.get("/", (req, res) => {
    res.send("API is running...");
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();
