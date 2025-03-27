const { pool } = require("../db/postgres");
const bcrypt = require("bcrypt");

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

const authenticationController = {
  // Register new user
  signup: async (req, res) => {
    const { email, password, firstName, lastName, userRole } = req.body;

    try {
      const passwordHash = await hashPassword(password);
      const result = await pool.query(
        "INSERT INTO users (email, password_hash, first_name, last_name, user_role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [email, passwordHash, firstName, lastName, userRole || "student"]
      );
      const user = result.rows[0];
      delete user.password_hash;
      res.status(201).json({ user });
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
