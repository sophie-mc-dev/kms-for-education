const { pool } = require("../db/db");

const modulesController = {
  getModuleById: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query("SELECT * FROM modules WHERE id = $1", [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error fetching module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  updateModule: async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    try {
      const result = await pool.query(
        `UPDATE modules SET title = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
        [title, description, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      res.json({ message: "Module updated successfully", module: result.rows[0] });
    } catch (err) {
      console.error("Error updating module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  removeModule: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query("DELETE FROM modules WHERE id = $1 RETURNING *", [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      res.json({ message: "Module deleted successfully" });
    } catch (err) {
      console.error("Error deleting module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  addModuleResources: async (req, res) => {
    const { id } = req.params; // Module ID
    const { resource_id } = req.body;

    if (!resource_id) {
      return res.status(400).json({ error: "Resource ID is required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO module_resources (module_id, resource_id) VALUES ($1, $2) RETURNING *`,
        [id, resource_id]
      );

      res.status(201).json({ message: "Resource added to module", moduleResource: result.rows[0] });
    } catch (err) {
      console.error("Error adding resource to module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getModuleResources: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `SELECT r.* FROM resources r
         JOIN module_resources mr ON r.id = mr.resource_id
         WHERE mr.module_id = $1`,
        [id]
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching module resources:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  deleteModuleResources: async (req, res) => {
    const { id, resource_id } = req.params;

    try {
      const result = await pool.query(
        "DELETE FROM module_resources WHERE module_id = $1 AND resource_id = $2 RETURNING *",
        [id, resource_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found in module" });
      }

      res.json({ message: "Resource removed from module" });
    } catch (err) {
      console.error("Error removing resource from module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = modulesController;
