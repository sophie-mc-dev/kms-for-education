const { pool } = require("../db/db");

const learningPathsController = {
  addLearningPath: async (req, res) => {
    const { title, description, visibility, estimated_duration, ects } = req.body;
    const user_id = req.user.user_id;

    if (!title || !description || !visibility || !estimated_duration || ects === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO learning_paths (title, description, user_id, visibility, estimated_duration, ects, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [title, description, user_id, visibility, estimated_duration, ects]
      );
      res.status(201).json({ message: "Learning Path created", learningPath: result.rows[0] });
    } catch (err) {
      console.error("Error creating learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  removeLearningPath: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("DELETE FROM learning_paths WHERE id = $1 RETURNING *", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Learning Path not found" });
      }
      res.json({ message: "Learning Path deleted successfully" });
    } catch (err) {
      console.error("Error deleting learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getLearningPaths: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT lp.*, u.first_name, u.last_name 
         FROM learning_paths lp
         JOIN users u ON lp.user_id = u.user_id
         ORDER BY lp.created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching learning paths:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getLearningPathById: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `SELECT lp.*, u.first_name, u.last_name 
         FROM learning_paths lp
         JOIN users u ON lp.user_id = u.user_id
         WHERE lp.id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Learning Path not found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error fetching learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  updateLearningPath: async (req, res) => {
    const { id } = req.params;
    const { title, description, visibility, estimated_duration, ects } = req.body;

    if (!title || !description || !visibility || !estimated_duration || ects === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const result = await pool.query(
        `UPDATE learning_paths 
         SET title = $1, description = $2, visibility = $3, estimated_duration = $4, ects = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [title, description, visibility, estimated_duration, ects, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Learning Path not found" });
      }
      res.json({ message: "Learning Path updated", learningPath: result.rows[0] });
    } catch (err) {
      console.error("Error updating learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  addExistingModuleToLearningPath: async (req, res) => {
    const { learning_path_id, module_id } = req.params;
  
    if (!learning_path_id || !module_id) {
      return res.status(400).json({ error: "Learning path ID and module ID are required" });
    }
    
    try {
      const learningPathCheck = await pool.query("SELECT * FROM learning_paths WHERE id = $1", [learning_path_id]);
      if (learningPathCheck.rows.length === 0) {
        return res.status(404).json({ error: "Learning path not found" });
      }
      
      const moduleCheck = await pool.query("SELECT * FROM modules WHERE id = $1", [module_id]);
      if (moduleCheck.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      await pool.query(
        `INSERT INTO learning_path_modules (learning_path_id, module_id) VALUES ($1, $2)`,
        [learning_path_id, module_id]
      );
      
      res.status(201).json({ message: "Module added to learning path successfully" });
    } catch (err) {
      console.error("Error adding module to learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getModulesByLearningPath: async (req, res) => {
    const { learning_path_id } = req.params;
  
    try {
      // Query to fetch all modules for the specified learning path
      const result = await pool.query(
        `SELECT m.*
         FROM modules m
         JOIN learning_path_modules lpm ON m.id = lpm.module_id
         WHERE lpm.learning_path_id = $1`,
        [learning_path_id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No modules found for this learning path" });
      }
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching modules for learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = learningPathsController;
