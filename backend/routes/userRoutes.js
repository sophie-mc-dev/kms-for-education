const express = require("express");
const router = express.Router();
const passport = require("passport");

const userController = require("../controllers/userController");

// Register user
router.post("/sign-up", userController.signup);

// Login user
router.post(
  "/sign-in",
  passport.authenticate("local", { failureMessage: true }),
  userController.signin
);

// Get all users
router.get("/users", userController.getAllUsers);

// Get user by ID
router.get("/users/:id", userController.getUserById);

// Update user
router.put("/users/:id", userController.updateUser);

// Delete all users
router.delete('/users', userController.deleteAllUsers);

// Delete user by ID
router.delete('/users/:id', userController.deleteUserById);

module.exports = router;
