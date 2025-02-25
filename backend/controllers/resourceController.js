const { pool } = require("../db/db");

const resourceController = {
  // Upload a new resource
  uploadResource: async (req, res) => {
    console.log("Received Form Data:", req.body); 

    const { title, description, url, type, category, created_by, tags, visibility, estimated_time } = req.body;

    try {
        let file_path = req.file ? req.file.path : null; // If no file, this will be null

        const result = await pool.query(
            `INSERT INTO resources (title, description, url, type, category, created_by, tags, file_path, visibility, estimated_time) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *`,
            [title, description, url, type, category, created_by, tags, file_path, visibility, estimated_time]
        );

        res.status(201).json({ message: "Resource uploaded successfully", resource: result.rows[0] });
    } catch (error) {
        console.error("Error uploading resource:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
},

  // Get all resources
  getAllResources: async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM resources ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get a single resource by ID
  getResourceById: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query("SELECT * FROM resources WHERE id = $1", [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching resource:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Update a resource
  updateResource: async (req, res) => {
    const { id } = req.params;
    const { title, description, url, type, category, tags, file_path, status } = req.body;

    try {
      const result = await pool.query(
        `UPDATE resources 
         SET title = $1, description = $2, url = $3, type = $4, category = $5, tags = $6, file_path = $7, status = $8, updated_at = NOW()
         WHERE id = $9 RETURNING *`,
        [title, description, url, type, category, tags, file_path, status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      res.json({ message: "Resource updated successfully", resource: result.rows[0] });
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Delete a resource
  deleteResource: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query("DELETE FROM resources WHERE id = $1 RETURNING *", [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      res.json({ message: "Resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

module.exports = resourceController;
