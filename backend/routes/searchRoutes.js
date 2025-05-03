const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

router.get("/resources", searchController.searchResources);
router.get("/modules", searchController.searchModules);

module.exports = router;
