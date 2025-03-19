require("dotenv").config();
const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
);

const testNeo4jConnection = async () => {
  const session = driver.session();
  try {
    await session.run("RETURN 1");
    console.log("Successfully connected to Neo4j database!");
    return true;
  } catch (error) {
    console.error("Error connecting to Neo4j:", error);
    return false;
  } finally {
    await session.close();
  }
};

module.exports = { driver, testNeo4jConnection };
