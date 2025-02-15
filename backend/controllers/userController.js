const { pool } = require('../db/db');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

const userController = {
    // Register new user
    signup: async (req, res) => {
        const { username, email, password, firstName, lastName, userRole } = req.body;

        try {
            const passwordHash = await hashPassword(password);
            const result = await pool.query(
                'INSERT INTO users (username, email, password_hash, first_name, last_name, user_role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [username, email, passwordHash, firstName, lastName, userRole || 'student']
            );
            const user = result.rows[0];
            delete user.password_hash;
            res.status(201).json({ user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error signing up user' });
        }
    },

    // User login
    login: (req, res) => {
        delete req.user.password_hash;
        res.json({ user: req.user });
    },

    // Get all users
    getAllUsers: async (req, res) => {
        try {
            const result = await pool.query('SELECT user_id, username, email, first_name, last_name, user_role FROM users');
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ message: 'Error fetching users' });
        }
    },

    // Get a user by ID
    getUserById: async (req, res) => {
        const userId = req.params.id;

        try {
            const result = await pool.query(
                'SELECT user_id, username, email, first_name, last_name, user_role FROM users WHERE user_id = $1',
                [userId]
            );
            const user = result.rows[0];

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(user);
        } catch (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ message: 'Error fetching user' });
        }
    },

    // Update user info
    updateUser: async (req, res) => {
        const userId = req.params.id;
        const { username, email, firstName, lastName, userRole, password } = req.body;

        try {
            let updateQuery = 'UPDATE users SET username = $1, email = $2, first_name = $3, last_name = $4, user_role = $5';
            let values = [username, email, firstName, lastName, userRole, userId];

            if (password) {
                const passwordHash = await hashPassword(password);
                updateQuery += ', password_hash = $6';
                values = [username, email, firstName, lastName, userRole, passwordHash, userId];
            }

            updateQuery += ' WHERE user_id = $' + values.length + ' RETURNING *';

            const result = await pool.query(updateQuery, values);
            const updatedUser = result.rows[0];

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            delete updatedUser.password_hash;
            res.json({ user: updatedUser });
        } catch (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ message: 'Error updating user' });
        }
    }
};

module.exports = userController;