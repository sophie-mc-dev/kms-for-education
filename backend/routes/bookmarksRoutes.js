const express = require("express");
const router = express.Router();
const bookmarksController = require("../controllers/bookmarksController");

router.post("/:user_id/:resource_id", bookmarksController.addBookmark);
router.delete("/:user_id/:resource_id", bookmarksController.removeBookmark);
router.get("/:user_id", bookmarksController.getUserBookmarks);

module.exports = router;
