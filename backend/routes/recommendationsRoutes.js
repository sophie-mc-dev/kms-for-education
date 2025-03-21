const express = require("express");
const router = express.Router();
const recommendationsController = require("../controllers/recommendationsController");

router.get("/recommendations/:userId", recommendationsController.getRecommendations);

module.exports = router;
