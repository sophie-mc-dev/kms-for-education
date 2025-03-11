const { pool } = require("../db/db");

const multer = require('multer');
const mammoth = require('mammoth');
const DOMPurify = require('dompurify');
const fs = require('fs');
const { google } = require('googleapis');
const { Readable } = require('stream');

const resourcesController = {
  // Upload a new resource
  uploadResource: async (req, res) => {
    console.log("Received Form Data:", req.body); 

    const { title, description, url, type, category, created_by, tags, visibility, estimated_time } = req.body;

    try {
        let file_path = req.file ? req.file.path : null; 
        let convertedHtml = null;
        let format = req.file ? req.file.originalname.split('.').pop() : null; 

        const result = await pool.query(
          `INSERT INTO resources (title, description, url, type, category, created_by, tags, file_path, visibility, estimated_time, format) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
          RETURNING *`,
          [title, description, url, type, category, created_by, tags, file_path, visibility, estimated_time, format]
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
    const {
      title,
      description,
      url,
      type,
      category,
      created_by,
      tags,
      file_path,
      visibility,
      estimated_time
    } = req.body;

    try {
      // Check if the resource exists before updating
      const existingResource = await pool.query(`SELECT * FROM resources WHERE id = $1`, [id]);
      if (existingResource.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      // Build dynamic query for partial updates
      const fields = [];
      const values = [];
      let index = 1;

      if (title !== undefined) { fields.push(`title = $${index++}`); values.push(title); }
      if (description !== undefined) { fields.push(`description = $${index++}`); values.push(description); }
      if (url !== undefined) { fields.push(`url = $${index++}`); values.push(url); }
      if (type !== undefined) { fields.push(`type = $${index++}`); values.push(type); }
      if (category !== undefined) { fields.push(`category = $${index++}`); values.push(category); }
      if (created_by !== undefined) { fields.push(`created_by = $${index++}`); values.push(created_by); }
      if (tags !== undefined) { fields.push(`tags = $${index++}`); values.push(tags); }
      if (file_path !== undefined) { fields.push(`file_path = $${index++}`); values.push(file_path); }
      if (visibility !== undefined) { fields.push(`visibility = $${index++}`); values.push(visibility); }
      if (estimated_time !== undefined) { fields.push(`estimated_time = $${index++}`); values.push(estimated_time); }
      if (format !== undefined) { fields.push(`format = $${index++}`); values.push(format); }

      // Ensure there's something to update
      if (fields.length === 0) {
        return res.status(400).json({ error: "No fields provided for update" });
      }

      // Add updated_at timestamp
      fields.push(`updated_at = NOW()`);

      // Construct query
      const query = `UPDATE resources SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`;
      values.push(id);

      // Execute update query
      const result = await pool.query(query, values);

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
      // Check if the resource exists before deleting
      const existingResource = await pool.query("SELECT * FROM resources WHERE id = $1", [id]);

      if (existingResource.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      // Delete the resource
      await pool.query("DELETE FROM resources WHERE id = $1", [id]);

      res.json({ message: "Resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting resource:", error);

      // Handle foreign key constraint error
      if (error.code === "23503") {
        return res.status(400).json({ error: "Cannot delete resource as it is referenced in another table." });
      }

      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = resourcesController;
