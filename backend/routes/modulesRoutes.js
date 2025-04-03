const express = require("express");
const router = express.Router();
const modulesController = require("../controllers/modulesController");

// Get all modules
router.get("/", modulesController.getAllModules);

// Get a single module by ID
router.get("/:id", modulesController.getModuleById);

// Create a new module
router.post("/", modulesController.createModule);

// Update a module
router.put("/:id", modulesController.updateModule);

// Delete a module
router.delete("/:id", modulesController.deleteModule);

// Adding an existing resource to a module
router.get("/:module_id/resources", modulesController.getResourcesByModuleId);
router.get("/:module_id/resource_count", modulesController.getModuleResourceCount);
router.get("/:resource_id/modules", modulesController.getModulesByResourceId);

// Progress and Assessment
router.get("/:module_id/assessment", modulesController.getAssessmentByModuleId);
router.get("/:module_id/assessment/results/:user_id", modulesController.getAssessmentResults);
router.get("/assessment/results", modulesController.getAllAssessmentResults);

router.put("/:module_id/assessment/results/:user_id", modulesController.updateAssessmentAttempts);
router.put("/:module_id/assessment/status/:user_id", modulesController.updateAssessmentStatus);
router.get("/:module_id/assessment/status/:user_id", modulesController.getAssessmentStatus);

router.delete("/:module_id/assessment/results/:user_id", modulesController.deleteAssessmentResults);

router.post("/:module_id/start", modulesController.startModule);
router.post("/:module_id/complete/:user_id", modulesController.updateStandaloneModuleCompletion);
router.get("/:module_id/status", modulesController.getModuleStatus);

module.exports = router;
