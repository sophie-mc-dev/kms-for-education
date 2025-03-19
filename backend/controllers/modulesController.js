const { pool } = require("../db/postgres");

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
    const {
      title,
      description,
      order_index,
      assessment_id,
      estimated_duration,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO modules (title, description, order_index, assessment_id, estimated_duration) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          title,
          description,
          order_index,
          assessment_id || null,
          estimated_duration,
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
    const {
      title,
      description,
      order_index,
      assessment_id,
      estimated_duration,
    } = req.body;
    try {
      const result = await pool.query(
        `UPDATE modules 
         SET title = $1, description = $2, order_index = $3, assessment_id = $4, estimated_duration = $5, updated_at = NOW()
         WHERE id = $6 
         RETURNING *`,
        [title, description, order_index, assessment_id, estimated_duration, id]
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
      await pool.query("DELETE FROM module_resources WHERE module_id = $1", [
        id,
      ]);
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

  addExistingResourceToModule: async (req, res) => {
    const { module_id, resource_id } = req.params;

    if (!module_id || !resource_id) {
      return res
        .status(400)
        .json({ error: "Module ID and resource ID are required" });
    }

    try {
      const moduleCheck = await pool.query(
        "SELECT * FROM modules WHERE id = $1",
        [module_id]
      );
      if (moduleCheck.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      const resourceCheck = await pool.query(
        "SELECT * FROM resources WHERE id = $1",
        [resource_id]
      );
      if (resourceCheck.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      await pool.query(
        `INSERT INTO module_resources (module_id, resource_id) VALUES ($1, $2)`,
        [module_id, resource_id]
      );

      res
        .status(201)
        .json({ message: "Resource added to module successfully" });
    } catch (err) {
      console.error("Error adding resource to module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Remove a resource from a module
  removeResourceFromModule: async (req, res) => {
    const { module_id, resource_id } = req.params;

    try {
      const result = await pool.query(
        "DELETE FROM module_resources WHERE module_id = $1 AND resource_id = $2 RETURNING *",
        [module_id, resource_id]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Resource not found in the specified module" });
      }

      res.json({ message: "Resource removed from module successfully" });
    } catch (err) {
      console.error("Error removing resource from module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get resources by module ID
  getResourcesByModuleId: async (req, res) => {
    const { module_id } = req.params;
    try {
      const result = await pool.query(
        `SELECT r.* FROM resources r
          INNER JOIN module_resources mr ON r.id = mr.resource_id
          WHERE mr.module_id = $1 ORDER BY mr.resource_order ASC`,
        [module_id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching resources for module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getModuleResourceCount: async (req, res) => {
    const { module_id } = req.params;
    try {
      const result = await pool.query(
        `SELECT COUNT(*) AS resource_count FROM module_resources WHERE module_id = $1`,
        [module_id]
      );

      res.json({
        module_id,
        resource_count: parseInt(result.rows[0].resource_count),
      });
    } catch (error) {
      console.error("Error fetching resource count for module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getModulesByResourceId: async (req, res) => {
    const { resource_id } = req.params;

    try {
      const result = await pool.query(
        `SELECT m.* 
         FROM modules m
         INNER JOIN module_resources mr ON m.id = mr.module_id
         WHERE mr.resource_id = $1
         ORDER BY m.id ASC`,
        [resource_id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching modules for resource:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = modulesController;
