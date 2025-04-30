const { pool } = require("../scripts/postgres");
const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

const usersController = {
  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT user_id, email, first_name, last_name, user_role FROM users"
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Error fetching users" });
    }
  },

  updateProfile: async (req, res) => {
    const { user_id } = req.params;
    const {
      educationLevel,
      fieldOfStudy,
      topicInterests,
      preferredContentTypes,
      languagePreference,
    } = req.body;

    try {
      // Update the user's profile with the provided data
      const result = await pool.query(
        `UPDATE users
         SET
           education_level = $1,
           field_of_study = $2,
           topic_interests = $3,
           preferred_content_types = $4,
           language_preference = $5,
         WHERE id = $6
         RETURNING *`,
        [
          educationLevel,
          fieldOfStudy,
          topicInterests,
          preferredContentTypes,
          languagePreference,
          user_id,
        ]
      );

      const updatedUser = result.rows[0];
      res.status(200).json({ user: updatedUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating user profile" });
    }
  },

  // Get a user by ID
  getUserById: async (req, res) => {
    const userId = req.params.id;

    try {
      const result = await pool.query(
        "SELECT user_id, email, first_name, last_name, user_role FROM users WHERE user_id = $1",
        [userId]
      );
      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Error fetching user" });
    }
  },

  // Update user info
  updateUser: async (req, res) => {
    const userId = req.params.id;
    const { email, first_name, last_name, user_role, password } = req.body;

    if (!user_role) {
      return res.status(400).json({ message: "user_role is required" });
    }

    try {
      let updateQuery = `
        UPDATE users 
        SET email = $1, first_name = $2, last_name = $3, user_role = $4, updated_at = NOW()`;
      let values = [email, first_name, last_name, user_role];

      if (password) {
        const passwordHash = await hashPassword(password);
        updateQuery += ", password_hash = $5";
        values.push(passwordHash);
      }

      values.push(userId); // Append userId at the end
      updateQuery += ` WHERE user_id = $${values.length} RETURNING *`;

      const result = await pool.query(updateQuery, values);
      const updatedUser = result.rows[0];

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      delete updatedUser.password_hash;
      res.json({ user: updatedUser });
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "Error updating user" });
    }
  },

  // Delete all users
  deleteAllUsers: async (req, res) => {
    try {
      await pool.query("DELETE FROM users");
      res.json({ message: "All users deleted successfully" });
    } catch (err) {
      console.error("Error deleting all users:", err);
      res.status(500).json({ message: "Error deleting all users" });
    }
  },

  // Delete user by ID
  deleteUserById: async (req, res) => {
    const userId = req.params.id;

    try {
      const result = await pool.query(
        "DELETE FROM users WHERE user_id = $1 RETURNING *",
        [userId]
      );
      const deletedUser = result.rows[0];

      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Error deleting user" });
    }
  },

  addUserLearningPathProgress: async (req, res) => {
    const userId = req.user.id;
    const { learningPathId } = req.params;

    try {
      // Insert progress record (default 0% progress)
      const result = await pool.query(
        `INSERT INTO user_learning_path_progress (user_id, learning_path_id, progress)
         VALUES ($1, $2, 0) RETURNING *`,
        [userId, learningPathId]
      );

      res.status(201).json({
        message: "Learning path progress started",
        progress: result.rows[0],
      });
    } catch (err) {
      console.error("Error adding learning path progress:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getUserLearningPaths: async (req, res) => {
    const userId = req.user.id;

    try {
      const result = await pool.query(
        `SELECT lp.* FROM learning_paths lp
         JOIN user_learning_paths ulp ON lp.id = ulp.learning_path_id
         WHERE ulp.user_id = $1`,
        [userId]
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching user learning paths:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  updateUserLearningPathProgress: async (req, res) => {
    const userId = req.user.id;
    const { learningPathId } = req.params;
    const { progress } = req.body;

    if (progress < 0 || progress > 100) {
      return res
        .status(400)
        .json({ error: "Progress must be between 0 and 100" });
    }

    try {
      const result = await pool.query(
        `UPDATE learning_path_progress 
         SET progress_percentage = $1, updated_at = NOW()
         WHERE user_id = $2 AND learning_path_id = $3 RETURNING *`,
        [progress, userId, learningPathId]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Learning path progress not found" });
      }

      res.json({
        message: "Learning path progress updated",
        progress: result.rows[0],
      });
    } catch (err) {
      console.error("Error updating learning path progress:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // get a user's started learning paths
};

module.exports = usersController;
