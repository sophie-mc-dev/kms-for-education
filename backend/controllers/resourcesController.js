const { pool } = require("../db/postgres");
const { uploadToR2 } = require("../utils/r2-upload");
const { deleteFromR2 } = require("../utils/r2-delete");
const { searchResources } = require("../ontology/ontologyService")

const resourcesController = {
  // Upload a new resource
  uploadResource: async (req, res) => {
    console.log("Received Form Data:", req.body);

    const {
      title,
      description,
      url,
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
        `INSERT INTO resources (title, description, url, type, category, created_by, tags, visibility, estimated_time, format) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
          RETURNING *`,
        [
          title,
          description,
          url,
          type,
          category,
          created_by,
          tags,
          visibility,
          parseInt(estimated_time),
          format,
        ]
      );

      const resourceId = result.rows[0].id;

      let finalUrl = url;

      if (req.file) {
        // 2. Upload file to R2
        console.log("File received in uploadToR2:", req.file);
        const uploadResult = await uploadToR2(req.file, resourceId);

        console.log("Upload result:", uploadResult);

        if (!uploadResult) {
          throw new Error("Failed to upload file to R2");
        }

        finalUrl = uploadResult;
      }

      // 3. Update the URL field in the database if it was changed (either provided or uploaded)
      await client.query(`UPDATE resources SET url = $1 WHERE id = $2`, [
        finalUrl,
        resourceId,
      ]);

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

      let r2Url = url;

      if (req.file) {
        // Upload new file to R2
        const uploadResult = await uploadToR2(req.file, id);
        if (!uploadResult?.url || !uploadResult?.key) {
          throw new Error("Failed to upload new file to R2");
        }

        r2Url = uploadResult.url;
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
      console.error("Error uploading resource:", error);

      if (client) {
        await client.query("ROLLBACK");
      }

      if (r2Key) {
        try {
          await deleteFromR2(r2Key);
          console.log(`🧹 Rolled back: Deleted file ${r2Key} from R2`);
        } catch (deleteError) {
          console.error(
            "❌ Failed to delete R2 file after rollback:",
            deleteError
          );
        }
      }

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

      if (existingResource.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
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

  getResourcesByCreator: async (req, res) => {
    try {
      const createdBy = req.user;
      console.log("REQ USER: ", createdBy);

      const result = await pool.query(
        "SELECT * FROM resources WHERE created_by = $1 ORDER BY created_at DESC",
        [createdBy]
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

  searchResources: async (req, res) => {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    try {
      const results = await searchResources(query);
      res.json(results);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Error searching resources: " + err.message });
    }
  },
};

module.exports = resourcesController;
