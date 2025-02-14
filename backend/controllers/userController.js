const { pool } = require('../db/db');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

const authController = {
    signup: async (req, res) => {
        const { username, email, password, first_name, last_name, role } = req.body;

        try {
            const password_hash = await hashPassword(password);
            const result = await pool.query(
                'INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [username, email, password_hash, first_name, last_name, role || 'student']
            );
            const user = result.rows[0];
            delete user.password_hash;
            res.status(201).json({ user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error signing up user' });
        }
    },

    login: (req, res) => {
        delete req.user.password_hash;
        res.json({ user: req.user });
    },
};

module.exports = authController;