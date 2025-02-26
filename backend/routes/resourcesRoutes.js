const express = require("express");
const router = express.Router();
const resourcesController = require("../controllers/resourcesController");

const multer = require("multer");
const upload = multer();

router.post("/upload", upload.none(), resourcesController.uploadResource);

router.get("/", resourcesController.getAllResources);

router.get("/:id", resourcesController.getResourceById);

router.put("/:id", resourcesController.updateResource);

router.delete("/:id", resourcesController.deleteResource);

module.exports = router;
