require("dotenv").config();
const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const testNeo4jConnection = async (retries = 5, delayMs = 3000) => {
  let attempts = 0;
  const session = driver.session();

  while (attempts < retries) {
    try {
      // Try to run a simple query to check connection
      await session.run("RETURN 1");
      console.log("✅ Successfully connected to Neo4j database!");
      await session.close();
      return true;  
    } catch (error) {
      attempts++;
      if (attempts < retries) {
        console.log(`⏳ Neo4j is still starting... Retrying in ${delayMs}ms...`);
        await new Promise(res => setTimeout(res, delayMs));  // Wait before retry
      }
    }
  }

  // If failed after all attempts
  console.error("🚫 Failed to connect to Neo4j after multiple attempts.");
  await session.close();
  return false;
};


module.exports = { driver, testNeo4jConnection };
