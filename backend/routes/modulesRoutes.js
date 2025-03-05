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

module.exports = router;
