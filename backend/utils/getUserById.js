const { pool } = require("../scripts/postgres");

async function getUserProfile(userId) {
  const result = await pool.query(
    `SELECT education_level, field_of_study, preferred_content_types, topic_interests, language_preference
     FROM users
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0]; 
}

module.exports = { getUserProfile };
