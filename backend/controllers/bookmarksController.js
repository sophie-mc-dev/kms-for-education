const { pool } = require("../db/postgres");

const bookmarksController = {
  // Add a bookmark
  addBookmark: async (req, res) => {
    const { user_id, resource_id } = req.params;

    try {
      // Check if resource exists
      const resourceCheck = await pool.query(
        "SELECT id FROM resources WHERE id = $1",
        [resource_id]
      );

      if (resourceCheck.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found" });
      }

      // Insert the bookmark and retrieve the bookmark id
      const result = await pool.query(
        `INSERT INTO bookmarks (user_id, resource_id) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id, resource_id) DO NOTHING 
             RETURNING id, user_id, resource_id`,
        [user_id, resource_id]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: "Resource already bookmarked." });
      }

      const bookmarkId = result.rows[0].id;

      // Log the interaction in the user_interactions table
      await pool.query(
        `INSERT INTO user_interactions (user_id, resource_id, interaction_type)
               VALUES ($1, $2, 'bookmarked')`,
        [user_id, resource_id]
      );

      res.status(201).json({
        message: "Resource bookmarked successfully",
        bookmark: { id: bookmarkId, user_id, resource_id },
      });
    } catch (error) {
      console.error("Error bookmarking resource:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Remove a bookmark
  removeBookmark: async (req, res) => {
    const { user_id, resource_id } = req.params;

    try {
      const result = await pool.query(
        `DELETE FROM bookmarks WHERE user_id = $1 AND resource_id = $2 RETURNING *`,
        [user_id, resource_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Bookmark not found" });
      }

      // Remove the interaction log from the user_interactions table
      await pool.query(
        `DELETE FROM public.user_interactions
               WHERE user_id = $1 AND resource_id = $2 AND interaction_type = 'bookmarked'`,
        [user_id, resource_id]
      );

      res.json({ message: "Bookmark removed successfully" });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get all bookmarked resources for a user
  getUserBookmarks: async (req, res) => {
    const { user_id } = req.params;

    try {
      // Check if the user exists
      const userCheck = await pool.query(
        "SELECT user_id FROM users WHERE user_id = $1",
        [user_id]
      );
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const result = await pool.query(
        `SELECT r.* FROM resources r
             JOIN bookmarks b ON r.id = b.resource_id
             WHERE b.user_id = $1`,
        [user_id]
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = bookmarksController;
