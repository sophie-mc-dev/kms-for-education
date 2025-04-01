const express = require("express");
const router = express.Router();
const learningPathsController = require("../controllers/learningPathsController");
const passport = require("passport");

const isAuthenticated = (req, res, next) => {
  console.log("User is authenticated: ", req.isAuthenticated())
  if (req.isAuthenticated()) {
    return res.json({ message: 'Authenticated', user: req.user });
  } else {
    return res.status(401).json({ error: "User is not authenticated" });
  }
};



// CRUD for Learning Paths
router.post("/", learningPathsController.addLearningPath);
router.get("/", learningPathsController.getLearningPaths);
router.get("/:id", learningPathsController.getLearningPathById);
router.put("/:id", learningPathsController.updateLearningPath);
router.delete("/:id", learningPathsController.removeLearningPath);

// Adding an existing module to a learning path
router.get("/:learning_path_id/modules", learningPathsController.getModulesByLearningPath);

// Progress
// Ensure authentication middleware runs first
router.post("/:learning_path_id/start", learningPathsController.startLearningPath);
router.get("/in-progress/:user_id", learningPathsController.getStartedLearningPaths);
router.get("/:learning_path_id/progress/:user_id", learningPathsController.getLearningPathProgress);

module.exports = router;
