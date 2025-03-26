const express = require("express");
const router = express.Router();
const userInteractionsController = require("../controllers/userInteractionsController");

router.post("/resource-view", userInteractionsController.registerResourceView);
router.post("/module-view", userInteractionsController.registerModuleView);
router.post("/learning-path-view", userInteractionsController.registerLearningPathView);

router.get("popular-resources", userInteractionsController.getMostPopularResources);
router.get("popular-modules", userInteractionsController.getMostPopularModules);
router.get("popular-learning-paths", userInteractionsController.getMostPopularLearningPaths);

module.exports = router;