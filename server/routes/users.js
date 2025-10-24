// server/routes/users.js
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { verifyJWT } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

// All user management routes require admin privileges
router.use(verifyJWT, allowRoles('admin'));

// List users
router.get('/', userController.getUsers);

// Get a user by ID
router.get('/:id', userController.getUserById);

// Update user (e.g., role, verification)
router.patch('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
