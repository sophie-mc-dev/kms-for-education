const express = require("express");
const router = express.Router();
const learningPathsController = require("../controllers/learningPathsController");

// CRUD for Learning Paths
router.post("/", learningPathsController.addLearningPath);
router.delete("/:id", learningPathsController.removeLearningPath);
router.get("/", learningPathsController.getLearningPaths);
router.get("/:id", learningPathsController.getLearningPathById);
router.put("/:id", learningPathsController.updateLearningPath);

// Module management within Learning Paths
router.post("/:id/modules", learningPathsController.addLearningPathModules);
router.get("/:id/modules", learningPathsController.getLearningPathModules);

module.exports = router;
