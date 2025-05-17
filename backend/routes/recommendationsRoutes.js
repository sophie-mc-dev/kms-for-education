const express = require("express");
const router = express.Router();
const recommendationsController = require("../controllers/recommendationsController");

router.post("/resources", recommendationsController.getResourceRecommendationForModuleCreation);
router.post("/modules", recommendationsController.getModuleRecommendationForLPathCreation);
router.get("/:user_id/resources", recommendationsController.getResourceRecommendations);
router.get("/resources/:resource_id", recommendationsController.getRecommendationBasedOnResource);
router.get("/:user_id/learning-paths/:learning_path_id/resources", recommendationsController.getResourceRecommendationBasedOnLearningPath);

router.get("/modules/:resource_id", recommendationsController.getModulesRecommendationBasedOnResource);
router.get("/:user_id/modules/:module_id", recommendationsController.getModuleRecommendationBasedOnModule);

router.get("/:user_id/learning-paths/:module_id", recommendationsController.getLearningPathRecommendationBasedOnModules);
router.get("/:user_id/learning-paths/:learning_path_id", recommendationsController.getLPRecommendationBasedOnLearningPath);


module.exports = router;