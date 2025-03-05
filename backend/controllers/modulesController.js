const { pool } = require("../db/db");

const modulesController = {
  // Get all modules
  getAllModules: async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM modules ORDER BY id ASC");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get a single module by ID
  getModuleById: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT * FROM modules WHERE id = $1", [
        id,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Create a new module
  createModule: async (req, res) => {
    const { title, description, learning_path_id, order_index, assessment_id, estimated_duration } =
      req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO modules (title, description, learning_path_id, order_index, assessment_id, estimated_duration) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          title,
          description,
          learning_path_id,
          order_index,
          assessment_id || null,
          estimated_duration
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Update a module
  updateModule: async (req, res) => {
    const { id } = req.params;
    const { title, description, learning_path_id, order_index, assessment_id, estimated_duration } =
      req.body;
    try {
      const result = await pool.query(
        `UPDATE modules 
         SET title = $1, description = $2, learning_path_id = $3, order_index = $4, assessment_id = $5, estimated_duration = $6, updated_at = NOW()
         WHERE id = $7 
         RETURNING *`,
        [title, description, learning_path_id, order_index, assessment_id, estimated_duration, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Delete a module
  deleteModule: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "DELETE FROM modules WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = modulesController;
