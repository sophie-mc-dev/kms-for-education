const express = require("express");
const router = express.Router();
const recommendationsController = require("../controllers/recommendationsController");

router.get("/recommendations/:user_id", recommendationsController.getRecommendations);

module.exports = router;
