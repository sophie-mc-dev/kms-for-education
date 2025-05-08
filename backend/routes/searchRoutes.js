const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

router.get("/resources", searchController.searchResources);
router.get("/learning-content", searchController.searchLearningContent);

module.exports = router;
