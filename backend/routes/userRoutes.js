const express = require('express');
const router = express.Router();
const passport = require('passport');

const authController = require('../controllers/userController'); 

// REGISTER
router.post('/signup', authController.signup);

// LOGIN`
router.post('/login', passport.authenticate('local', { 
    failureRedirect: '/login',
    failureFlash: true,
}), authController.login);

module.exports = router;