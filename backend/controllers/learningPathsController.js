const { pool } = require("../db/db");

const learningPathsController = {
  addLearningPath: async (req, res) => {
    const { title, description, visibility } = req.body;
    const created_by = req.user.id; // Get logged-in user ID
  
    if (!title || !description || !created_by || !visibility) {
      return res.status(400).json({ error: "All fields are required" });
    }
  
    try {
      const result = await pool.query(
        `INSERT INTO learning_paths (title, description, created_by, visibility, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
        [title, description, created_by, visibility]
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
      const result = await pool.query("SELECT * FROM learning_paths ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching learning paths:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  /*
  FETCH AUTHOR'S NAME...
  getLearningPaths: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT lp.*, u.name AS author_name 
        FROM learning_paths lp
        JOIN users u ON lp.created_by = u.id
        ORDER BY lp.created_at DESC`
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching learning paths:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  */

  getLearningPathById: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query("SELECT * FROM learning_paths WHERE id = $1", [id]);

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
    const { title, description, visibility } = req.body;

    if (!title || !description || !visibility) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const result = await pool.query(
        `UPDATE learning_paths 
         SET title = $1, description = $2, visibility = $3, updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [title, description, visibility, id]
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

  addLearningPathModules: async (req, res) => {
    const { id } = req.params;
    const { module_id } = req.body;

    if (!module_id) {
      return res.status(400).json({ error: "Module ID is required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO learning_path_modules (learning_path_id, module_id)
         VALUES ($1, $2) RETURNING *`,
        [id, module_id]
      );

      res.status(201).json({ message: "Module added to Learning Path", learningPathModule: result.rows[0] });
    } catch (err) {
      console.error("Error adding module to learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getLearningPathModules: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `SELECT modules.* FROM modules 
         JOIN learning_path_modules ON modules.id = learning_path_modules.module_id
         WHERE learning_path_modules.learning_path_id = $1`,
        [id]
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching modules:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = learningPathsController;
