const express = require("express");
const router = express.Router();
const assessmentsController = require("../controllers/assessmentsController");

// CRUD for Assessments
router.post("/", assessmentsController.addAssessment);
router.get("/", assessmentsController.getAssessments);
router.get("/:id", assessmentsController.getAssessmentById);
router.put("/:id", assessmentsController.updateAssessment);
router.delete("/:id", assessmentsController.removeAssessment);

module.exports = router;
