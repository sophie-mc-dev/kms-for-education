const { pool } = require("../db/db");

const bookmarksController = {
    // Add a bookmark
    addBookmark: async (req, res) => {
        const { user_id, resource_id } = req.body;
    
        try {
        const result = await pool.query(
            `INSERT INTO bookmarks (user_id, resource_id) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id, resource_id) DO NOTHING 
            RETURNING *`,
            [user_id, resource_id]
        );
    
        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Resource already bookmarked." });
        }
    
        res.status(201).json({ message: "Resource bookmarked successfully", bookmark: result.rows[0] });
        } catch (error) {
        console.error("Error bookmarking resource:", error);
        res.status(500).json({ error: "Internal Server Error" });
        }
    },
    // Remove a bookmark
    removeBookmark: async (req, res) => {
        const { user_id, resource_id } = req.body;
    
        try {
        const result = await pool.query(
            `DELETE FROM bookmarks WHERE user_id = $1 AND resource_id = $2 RETURNING *`,
            [user_id, resource_id]
        );
    
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Bookmark not found" });
        }
    
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
        const result = await pool.query(
            `SELECT r.* FROM resources r
            JOIN bookmarks b ON r.id = b.resource_id
            WHERE b.user_id = $1`,
            [user_id]
        );
    
        res.json(result.rows);
        } catch (error) {
        console.error("Error fetching bookmarks:", error);
        res.status(500).json({ error: "Internal Server Error" });
        }
    },
  
  
}

module.exports = bookmarksController;
