const { pool } = require("../db/postgres");
const { driver } = require("../db/neo4j");

const recommendationsController = {
  // Get user interactions from PostgreSQL
  getUserInteractions: async (user_id) => {
    const query = `
        SELECT resource_id, module_id, learning_path_id, interaction_type 
        FROM user_interactions 
        WHERE user_id = $1
      `;
    const { rows } = await db.query(query, [user_id]);
    return rows;
  },

  // Content-Based Filtering (Neo4j) - Find similar resources based on shared tags
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
  getCollaborativeRecommendations: async (user_id) => {
    const query = `
      SELECT ui.resource_id, COUNT(*) AS count
      FROM user_interactions ui
      JOIN user_interactions other_ui ON ui.resource_id = other_ui.resource_id
      WHERE other_ui.user_id = $1 AND ui.user_id != $1
        AND ui.interaction_type IN ('bookmarked', 'completed_module', 'completed_learning_path')  
      GROUP BY ui.resource_id
      ORDER BY count DESC
      LIMIT 5
    `;
    const { rows } = await db.query(query, [user_id]);
    return rows.map((row) => row.resource_id);
  },  

  getRecommendations: async (req, res) => {
    try {
      const { user_id } = req.params;
  
      // 1. Get user interactions
      const interactions = await getUserInteractions(user_id);
      if (!interactions.length) {
        return res.json({ message: "No interactions found." });
      }
  
      // 2. Get content-based recommendations (from the last interacted resource)
      const lastInteraction = interactions[0];
      const contentBasedRecs = await getSimilarResources(lastInteraction.resource_id);
  
      // 3. Get collaborative recommendations
      const collaborativeRecs = await getCollaborativeRecommendations(user_id);
  
      // 4. Combine recommendations with weighting
      const combinedRecs = [...new Set([...contentBasedRecs, ...collaborativeRecs])];
        
      // 5. Return final recommendations
      res.json({ recommendations: combinedRecs });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // todo:
  // add learning path recs
  // add module recs
  // based on completion/started
};

module.exports = recommendationsController;
