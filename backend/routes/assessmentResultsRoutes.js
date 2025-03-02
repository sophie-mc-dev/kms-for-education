const express = require("express");
const router = express.Router();
const assessmentResultsController = require("../controllers/assessmentResultsController");

// CRUD for Assessments
router.post("/", assessmentResultsController.submitAssessment);
router.get("/", assessmentResultsController.getUserResultsByModule);

module.exports = router;
