const { pool } = require("../scripts/postgres");
const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

const authenticationController = {
  // Register new user
  signup: async (req, res) => {
    const {
      email,
      password,
      firstName,
      lastName,
      userRole,
      educationLevel,
      fieldOfStudy,
      topicInterests,
      preferredContentTypes,
      languagePreference,
    } = req.body;

    try {
      const passwordHash = await hashPassword(password);

      const result = await pool.query(
        `INSERT INTO users 
          (email, password_hash, first_name, last_name, user_role, education_level, field_of_study, topic_interests, preferred_content_types, language_preference) 
          VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
          RETURNING *`,
        [
          email,
          passwordHash,
          firstName,
          lastName,
          userRole || "student",
          educationLevel,
          fieldOfStudy,
          topicInterests,
          preferredContentTypes,
          languagePreference,
        ]
      );

      const user = result.rows[0];
      delete user.password_hash;

      res.status(201).json({ userId: user.id, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error signing up user" });
    }
  },

  // User login
  signin: (req, res) => {
    console.log(req.user);
    console.log("Session Object:", req.session);
    const user = { ...req.user };
    delete user.password_hash;
    res.json({ user });
    console.log(req.body);
  },
};

module.exports = authenticationController;
