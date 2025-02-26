const express = require("express");
const router = express.Router();
const modulesController = require("../controllers/modulesController");

// CRUD for Modules
router.get("/:id", modulesController.getModuleById);
router.put("/:id", modulesController.updateModule);
router.delete("/:id", modulesController.removeModule);

// Module Resources Endpoints:
router.post("/:id/resources", modulesController.addModuleResources);
router.get("/:id", modulesController.getModuleResources);
router.delete("/:id/resources/:resource_id", modulesController.deleteModuleResources);

module.exports = router;
