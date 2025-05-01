const { Client } = require("@elastic/elasticsearch");

const esClient = new Client({
  node: "http://localhost:9200",
  auth: {
    username: "elastic",
    password: "elastic123",
  },
});

async function testElasticSearchConnection() {
  try {
    const health = await esClient.cluster.health();
    console.log("✅ Elasticsearch connected:", health.status);
    return true;
  } catch (err) {
    console.error("❌ Elasticsearch connection error:", err.message);
    return false;
  }
}

module.exports = { esClient, testElasticSearchConnection };
