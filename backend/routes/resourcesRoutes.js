const express = require("express");
const router = express.Router();
const resourcesController = require("../controllers/resourcesController");

const isAuthenticated = (req, res, next) => {
  console.log("User is authenticated: ", req.isAuthenticated())
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

const multer = require("multer");
const upload = multer();

router.post("/upload", upload.single('file'), resourcesController.uploadResource);

router.get("/", resourcesController.getAllResources);

router.get("/bycreator", isAuthenticated, resourcesController.getResourcesByCreator);

router.get("/:id", resourcesController.getResourceById);

router.put("/:id", resourcesController.updateResource);

router.delete("/:id", resourcesController.deleteResource);

module.exports = router;
