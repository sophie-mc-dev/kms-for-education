const { pool } = require("../db/postgres");
const { driver } = require("../db/neo4j");

const recommendationsController = {
  // based on user interaction history and resource popularity
  getResourceRecommendations: async (req, res) => {
    const userId = req.params.userId;

    const session = driver.session();
    try {
      const cypherQuery = `
        MATCH (u:User {id: $userId})-[:PERFORMED]->(i:Interaction)-[:TARGET]->(r:Resource)
        WITH u, r, i.weight AS weight
        OPTIONAL MATCH (r)-[:BELONGS_TO]->(cat:Category)
        OPTIONAL MATCH (r)-[:HAS_TAG]->(tag:Tag)
        WITH u, COLLECT(DISTINCT cat) AS categories, COLLECT(DISTINCT tag) AS tags, SUM(weight) AS userAffinityScore

        MATCH (rec:Resource)
        OPTIONAL MATCH (rec)-[:BELONGS_TO]->(cat2:Category)
        OPTIONAL MATCH (rec)-[:HAS_TAG]->(tag2:Tag)
        WHERE cat2 IN categories OR tag2 IN tags
        AND NOT EXISTS {
          MATCH (u)-[:PERFORMED]->(:Interaction)-[:TARGET]->(rec)
        }

        OPTIONAL MATCH (otherInt:Interaction)-[:TARGET]->(rec)
        WITH rec, SUM(otherInt.weight) AS popularityScore, userAffinityScore
        WITH rec, (popularityScore * 0.4 + userAffinityScore * 0.6) AS hybridScore
        RETURN rec {.*, score: hybridScore }
        ORDER BY score DESC
        LIMIT 10
      `;

      const result = await session.run(cypherQuery, { userId });

      const recommendations = result.records.map((record) => {
        const rec = record.get("rec");
        return {
          id: rec.id,
          title: rec.title,
          type: rec.type,
          score: rec.score,
          description: rec.description,
          ...rec.properties, // if needed
        };
      });

      res.json(recommendations);
    } catch (err) {
      console.error("Error getting recommendations:", err);
      res.status(500).json({ message: "Failed to get recommendations" });
    } finally {
      await session.close();
    }
  },

  // Personalized Learning Path Recommendations based on interactions with modules and resources
  // Get Similar Resources based on tags and category or metadata
  // For Standalone Modules, Get Similar Modules (for example if module is also in a LP, recommend modules of that LP)
  // Get Collaborative Recommendations for User
  // Get Recommended Resources Based on Interaction History
};

module.exports = recommendationsController;
