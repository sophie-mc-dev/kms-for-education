const { pool } = require("../db/postgres");
const { driver } = require("../db/neo4j");

const recommendationsController = {
  // Get user interactions from PostgreSQL
  getUserInteractions: async (userId) => {
    const query = `
        SELECT resource_id, module_id, learning_path_id, interaction_type 
        FROM user_interactions 
        WHERE user_id = $1
      `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  },

  // Content-Based Filtering (Neo4j) - Find similar resources
  getSimilarResources: async (resourceId) => {
    const session = neo4j.session();
    const query = `
      MATCH (r:Resource)-[:HAS_TAG|:OF_TYPE]->(tag)
      WITH r, COLLECT(tag) AS tags
      MATCH (similar:Resource)-[:HAS_TAG|:OF_TYPE]->(tag)
      WHERE similar <> r
      WITH similar, COUNT(tag) AS similarityScore
      ORDER BY similarityScore DESC
      LIMIT 5
      RETURN similar
    `;
    const result = await session.run(query, { resourceId });
    session.close();
    return result.records.map((record) => record.get("similar"));
  },

  // Collaborative Filtering (PostgreSQL) - Find resources interacted by similar users
  getCollaborativeRecommendations: async (userId) => {
    const query = `
      SELECT ui.resource_id, COUNT(*) AS count
      FROM user_interactions ui
      JOIN user_interactions other_ui ON ui.resource_id = other_ui.resource_id
      WHERE other_ui.user_id = $1 AND ui.user_id != $1
      GROUP BY ui.resource_id
      ORDER BY count DESC
      LIMIT 5
    `;
    const { rows } = await db.query(query, [userId]);
    return rows.map((row) => row.resource_id);
  },

  // Hybrid Recommendation Approach
  getRecommendations: async (req, res) => {
    try {
      const { userId } = req.params;

      // 1. Get user interactions
      const interactions = await getUserInteractions(userId);
      if (!interactions.length)
        return res.json({ message: "No interactions found." });

      // 2. Get content-based recommendations (from the last interacted resource)
      const lastInteraction = interactions[0];
      const contentBasedRecs = await getSimilarResources(
        lastInteraction.resource_id
      );

      // 3. Get collaborative recommendations
      const collaborativeRecs = await getCollaborativeRecommendations(userId);

      // Combine recommendations and return
      const recommendations = [
        ...new Set([...contentBasedRecs, ...collaborativeRecs]),
      ];
      res.json({ recommendations });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // get recommended learning paths
  // get recommneded modules
  // get recommended resources

  // based on started learning paths, viewed and completed modules, viewed resources, etc...
};

module.exports = recommendationsController;
