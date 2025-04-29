/*
REGISTER:
- log interactions
- interactions user history
- store timestamps to analyze time-based trends

- completed modules
- completed learning paths

- identify popular resources
- identify popular modules/learning paths

- identify user-specific preferences
- completing a module is more important than just viewing it
*/
const { pool } = require("../scripts/postgres");

const userInteractionsController = {
  // Registers an interaction with a resource
  registerResourceView: async (req, res) => {
    const { user_id, resource_id } = req.body;

    try {
      // Insert the interaction into the database
      const result = await pool.query(
        `INSERT INTO user_interactions (user_id, resource_id, interaction_type) 
           VALUES ($1, $2, 'viewed_resource') RETURNING id`,
        [user_id, resource_id]
      );

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error saving resource interaction:", error);
      res.status(500).json({ error: "Failed to save resource interaction" });
    }
  },

  // Registers an interaction with a module
  registerModuleView: async (req, res) => {
    const { user_id, module_id } = req.body;

    try {
      // Insert the interaction into the database
      const result = await pool.query(
        `INSERT INTO user_interactions (user_id, module_id, interaction_type) 
           VALUES ($1, $2, 'viewed_module') RETURNING id`,
        [user_id, module_id]
      );

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error saving module interaction:", error);
      res.status(500).json({ error: "Failed to save module interaction" });
    }
  },

  // Registers an interaction with a learning path
  registerLearningPathView: async (req, res) => {
    const { user_id, learning_path_id } = req.body;

    try {
      // Insert the interaction into the database
      const result = await pool.query(
        `INSERT INTO user_interactions (user_id, learning_path_id, interaction_type) 
           VALUES ($1, $2, 'viewed_learning_path') RETURNING id`,
        [user_id, learning_path_id]
      );

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error saving learning path interaction:", error);
      res
        .status(500)
        .json({ error: "Failed to save learning path interaction" });
    }
  },

  // Get the most popular resources based on interaction count
  getMostPopularResources: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT resource_id, COUNT(*) AS interactions_count
           FROM user_interactions
           GROUP BY resource_id
           ORDER BY interactions_count DESC`
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error retrieving most popular resources:", error);
      res
        .status(500)
        .json({ error: "Failed to retrieve most popular resources" });
    }
  },

  // Get the most popular modules based on interaction count
  getMostPopularModules: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT module_id, COUNT(*) AS interactions_count
           FROM user_interactions
           GROUP BY module_id
           ORDER BY interactions_count DESC`
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error retrieving most popular modules:", error);
      res
        .status(500)
        .json({ error: "Failed to retrieve most popular modules" });
    }
  },

  // Get the most popular learning paths based on interaction count
  getMostPopularLearningPaths: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT learning_path_id, COUNT(*) AS interactions_count
           FROM user_interactions
           GROUP BY learning_path_id
           ORDER BY interactions_count DESC`
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error retrieving most popular learning paths:", error);
      res
        .status(500)
        .json({ error: "Failed to retrieve most popular learning paths" });
    }
  },
};

module.exports = userInteractionsController;
