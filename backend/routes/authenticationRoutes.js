const express = require("express");
const router = express.Router();
const passport = require("passport");

const authenticationController = require("../controllers/authenticationController");

// Register user
router.post("/sign-up", authenticationController.signup);

// Login user
router.post(
  "/sign-in",
  passport.authenticate("local", { failureMessage: true }),
  authenticationController.signin
);

module.exports = router;
