const express = require("express");
const router = express.Router();
const learningPathsController = require("../controllers/learningPathsController");

// CRUD for Learning Paths
router.post("/", learningPathsController.addLearningPath);
router.delete("/:id", learningPathsController.removeLearningPath);
router.get("/", learningPathsController.getLearningPaths);
router.get("/:id", learningPathsController.getLearningPathById);
router.put("/:id", learningPathsController.updateLearningPath);

// CRUD for Modules
router.post("/:learning_path_id/modules", learningPathsController.addModuleToLearningPath);
router.get("/:learning_path_id/modules", learningPathsController.getModulesByLearningPath);
router.put("/:learning_path_id/modules/:id", learningPathsController.updateModule);
router.delete("/:learning_path_id/modules/:id", learningPathsController.removeModuleFromLearningPath);

// Module Resources Endpoints:
router.post("/:learning_path_id/modules/:id/resources", learningPathsController.addModuleResources);
router.get("/:learning_path_id/modules//:id/resources", learningPathsController.getModuleResources);
router.delete("/:learning_path_id/modules//:id/resources/:resource_id", learningPathsController.deleteModuleResources);

router.post("/:learning_path_id/modules/:id/progress", learningPathsController.checkModuleProgression);
router.post("/:learning_path_id/modules/:id/progress", learningPathsController.updateModuleProgression);

module.exports = router;
