const express = require("express");
const router = express.Router();
const bookmarksController = require("../controllers/bookmarksController");

router.post("/bookmarks", bookmarksController.addBookmark);
router.delete("/bookmarks", bookmarksController.removeBookmark);
router.get("/bookmarks/:user_id", bookmarksController.getUserBookmarks);

module.exports = router;
