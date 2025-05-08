const { pool } = require("./postgres"); // your DB connection
const { indexResource } = require("../services/elasticSearchService");
const { indexModule } = require("../services/elasticSearchService");
const { indexLearningPath } = require("../services/elasticSearchService");

(async () => {
  const client = await pool.connect();
  try {
    const resResources = await client.query("SELECT * FROM resources");
    for (const resource of resResources.rows) await indexResource(resource);

    const resModules = await client.query("SELECT * FROM modules");
    for (const module of resModules.rows) await indexModule(module);

    const resLearningPaths = await client.query("SELECT * FROM learning_paths");
    for (const learningPath of resLearningPaths.rows) await indexLearningPath(learningPath);

    console.log("🎉 Done indexing all resources and learning content!");
  } catch (err) {
    console.error("Error during indexing:", err.message);
  } finally {
    client.release();
    process.exit();
  }
})();
