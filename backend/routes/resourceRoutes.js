const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");

const multer = require("multer");
const upload = multer();

router.post("/upload", upload.none(), resourceController.uploadResource);

router.get("/", resourceController.getAllResources);

router.get(":id", resourceController.getResourceById);

router.put(":id", resourceController.updateResource);

router.delete(":id", resourceController.deleteResource);

module.exports = router;
