const express = require("express");
const router = express.Router();

const authenticationController = require("../controllers/authenticationController");

// Register user
router.post("/sign-up", authenticationController.signup);

// Login user
router.post("/sign-in", authenticationController.signin);

// Logout user
router.post("/sign-out", authenticationController.signout);

module.exports = router;
