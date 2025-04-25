const express = require("express");
const router = express.Router();
const recommendationsController = require("../controllers/recommendationsController");

router.get("/:user_id/resources", recommendationsController.getResourceRecommendations);
router.get("/modules/:resource_id", recommendationsController.getModulesRecommendationBasedOnResource);
router.get("/resources/:resource_id", recommendationsController.getRecommendationBasedOnResource);
router.get("/:user_id/modules/:module_id", recommendationsController.getRecommendationBasedOnModule);

module.exports = router;
