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
const userInteractionsRoutes = require("./routes/userInteractionsRoutes");
const recommendationRoutes = require("./routes/recommendationsRoutes");
const searchRoutes = require("./routes/searchRoutes");
const cors = require("cors");

const path = require("path");
const { loadOntology } = require("./ontology/ontologyService");

const app = express();
const port = process.env.PORT;

const { testElasticSearchConnection } = require("./scripts/elasticsearch"); // ElasticSearch
const { testPostgresConnection } = require("./scripts/postgres"); // PostgreSQL
const { testNeo4jConnection } = require("./scripts/neo4j"); // Neo4j
const { syncData } = require("./scripts/sync_pg_to_neo4j");

async function startServer() {
  if (!testElasticSearchConnection) {
    console.error("❌ Elastic Search connection failed. Exiting...");
    process.exit(1);
  }

  if (!testPostgresConnection) {
    console.error("❌ PostgreSQL connection failed. Exiting...");
    process.exit(1);
  }

  if (testNeo4jConnection) {
    try {
      await syncData();
    } catch (error) {
      console.warn("⚠️ Error syncing data to Neo4j:", error.message);
    }
  } else {
    console.warn("⚠️ Neo4j not connected. Continuing without Neo4j features.");
  }

  // Load the ontology
  const ontologyFilePath = path.join(__dirname, "ontology", "ontology.owl");

  try {
    await loadOntology(ontologyFilePath);
    console.log("✅ Ontology loaded successfully.");
  } catch (err) {
    console.error("❌ Error loading ontology: ", err);
    process.exit(1);
  }

  // CORS Configuration
  app.use(
    cors({
      origin: "http://localhost:5173",
      // origin: "*",
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
  app.use("/api/recommendations", recommendationRoutes);
  app.use("/api/search", searchRoutes);

  app.get("/", (req, res) => {
    res.send("API is running...");
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();
