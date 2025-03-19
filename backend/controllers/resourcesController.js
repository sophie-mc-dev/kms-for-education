const { pool } = require("../db/postgres");
const { convertToHTML } = require("../utils/convert-to-html");
const { uploadToR2 } = require("../utils/r2-upload");
const { deleteFromR2 } = require("../utils/r2-delete");
const multer = require("multer");

const resourcesController = {
  // Upload a new resource
  uploadResource: async (req, res) => {
    console.log("Received Form Data:", req.body);

    const {
      title,
      description,
      type,
      category,
      created_by,
      tags,
      visibility,
      estimated_time,
    } = req.body;

    let client;

    try {
      client = await pool.connect();
      await client.query("BEGIN");

      let format =
        req.file?.originalname?.split(".").pop()?.toLowerCase() || null;

      // 1. Insert resource data into the database
      const result = await client.query(
        `INSERT INTO resources (title, description, type, category, created_by, tags, visibility, estimated_time, format) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *`,
        [
          title,
          description,
          type,
          category,
          created_by,
          tags,
          visibility,
          estimated_time,
          format,
        ]
      );

      const resourceId = result.rows[0].id;

      let r2Url = null;
      let r2Key = null;

      if (req.file) {
        // 2. Upload file to R2
        console.log("File received in uploadToR2:", req.file);
        const uploadResult = await uploadToR2(req.file, resourceId);

        if (!uploadResult || !uploadResult.url || !uploadResult.key) {
          throw new Error("Failed to upload file to R2");
        }

        r2Url = uploadResult.url;
        r2Key = uploadResult.key;
      }

      // 3. Convert file to HTML if applicable
      let htmlContent = null;
      try {
        if (r2Url && ["txt", "md", "pdf", "docx"].includes(format)) {
          htmlContent = await convertToHTML(r2Url, format);
        }
      } catch (htmlError) {
        console.error("Error converting to HTML:", htmlError);
        htmlContent = null;
      }

      // 4. Store R2 URL, file key, and HTML content in the database
      await client.query(
        `UPDATE resources SET url = $1, file_key = $2, html_content = $3 WHERE id = $4`,
        [r2Url, r2Key, htmlContent, resourceId]
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Resource uploaded successfully",
        resourceId: resourceId,
      });
    } catch (error) {
      console.error("Error uploading resource:", error);

      if (client) {
        await client.query("ROLLBACK");
      }

      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      if (client) {
        client.release();
      }
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
      file_key,
      visibility,
      estimated_time,
      format,
      html_content,
    } = req.body;

    let client;

    try {
      client = await pool.connect();
      await client.query("BEGIN");

      // Check if the resource exists
      const existingResource = await client.query(
        `SELECT * FROM resources WHERE id = $1`,
        [id]
      );
      if (existingResource.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Resource not found" });
      }

      let r2Url = url; // Keep existing URL if no new file is uploaded
      let r2Key = file_key;

      if (req.file) {
        // Delete old file if a new one is uploaded
        if (r2Key) {
          await deleteFromR2(r2Key);
        }

        // Upload new file to R2
        const uploadResult = await uploadToR2(req.file, id);
        if (!uploadResult?.url || !uploadResult?.key) {
          throw new Error("Failed to upload new file to R2");
        }

        r2Url = uploadResult.url;
        r2Key = uploadResult.key;
      }

      // Dynamic query construction
      const fields = [];
      const values = [];
      let index = 1;

      const updates = {
        title,
        description,
        url: r2Url,
        type,
        category,
        created_by,
        tags,
        visibility,
        estimated_time,
        format,
        html_content,
        file_key: r2Key,
      };

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          fields.push(`${key} = $${index++}`);
          values.push(value);
        }
      }

      // Ensure there's something to update
      if (fields.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "No fields provided for update" });
      }

      // Add updated_at timestamp
      fields.push(`updated_at = NOW()`);

      // Construct query
      const query = `UPDATE resources SET ${fields.join(
        ", "
      )} WHERE id = $${index} RETURNING *`;
      values.push(id);

      // Execute update
      const result = await client.query(query, values);
      await client.query("COMMIT");

      res.json({
        message: "Resource updated successfully",
        resource: result.rows[0],
      });
    } catch (error) {
      console.error("Error updating resource:", error);
      if (client) await client.query("ROLLBACK");
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      if (client) client.release();
    }
  },

  // Delete a resource
  deleteResource: async (req, res) => {
    const { id } = req.params;

    let client;

    try {
      client = await pool.connect();
      await client.query("BEGIN");

      // Check if the resource exists and get its R2 file key
      const existingResource = await client.query(
        "SELECT file_key FROM resources WHERE id = $1",
        [id]
      );

      if (existingResource.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      const fileKey = existingResource.rows[0].file_key;

      // If the resource has an associated file in R2, delete it
      if (fileKey) {
        const deleteResult = await deleteFromR2(fileKey);
        if (!deleteResult.success) {
          throw new Error("Failed to delete file from R2");
        }
      }

      // Delete the resource from the database
      await client.query("DELETE FROM resources WHERE id = $1", [id]);

      await client.query("COMMIT");

      res.json({ message: "Resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting resource:", error);

      if (client) {
        await client.query("ROLLBACK");
      }

      // Handle foreign key constraint error
      if (error.code === "23503") {
        return res.status(400).json({
          error: "Cannot delete resource as it is referenced in another table.",
        });
      }

      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      if (client) {
        client.release();
      }
    }
  },

  // Get all resources
  getAllResources: async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM resources ORDER BY created_at DESC"
      );
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
      const result = await pool.query("SELECT * FROM resources WHERE id = $1", [
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching resource:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

};

module.exports = resourcesController;
