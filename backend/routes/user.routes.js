const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// TẤT CẢ CÁC ROUTES NÀY ĐỀU CHỈ DÀNH CHO ADMIN
router.use(authenticateToken, isAdmin);

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;