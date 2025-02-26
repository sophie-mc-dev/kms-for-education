const express = require("express");
const router = express.Router();
const passport = require("passport");

const usersController = require("../controllers/usersController");

// Register user
router.post("/sign-up", usersController.signup);

// Login user
router.post(
  "/sign-in",
  passport.authenticate("local", { failureMessage: true }),
  usersController.signin
);

// Get all users
router.get("/", usersController.getAllUsers);

// Get user by ID
router.get("/:id", usersController.getUserById);

// Update user
router.put("/:id", usersController.updateUser);

// Delete all users
router.delete('/', usersController.deleteAllUsers);

// Delete user by ID
router.delete('/:id', usersController.deleteUserById);

// Post User Learning Path Progress (start tracking)
router.post("/learning-paths/:learningPathId/progress", usersController.addUserLearningPathProgress);

// Get User Learning Paths (all enrolled learning paths)
router.get("/learning-paths", usersController.getUserLearningPaths);

// Get User Learning Path Progress (update progress %)
router.put("/learning-paths/:learningPathId/progress", usersController.updateUserLearningPathProgress);

module.exports = router;