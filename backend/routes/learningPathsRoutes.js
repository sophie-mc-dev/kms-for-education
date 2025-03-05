const express = require("express");
const router = express.Router();
const learningPathsController = require("../controllers/learningPathsController");
const passport = require("passport");

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({ error: "User not authenticated" });
  }
};

// CRUD for Learning Paths
router.post("/", isAuthenticated, learningPathsController.addLearningPath);
router.get("/", learningPathsController.getLearningPaths);
router.get("/:id", learningPathsController.getLearningPathById);
router.put("/:id", learningPathsController.updateLearningPath);
router.delete("/:id", learningPathsController.removeLearningPath);

// Adding an existing module to a learning path
router.post("/:learning_path_id/modules/:module_id", learningPathsController.addExistingModuleToLearningPath);
router.get("/:learning_path_id/modules", learningPathsController.getModulesByLearningPath);

module.exports = router;
