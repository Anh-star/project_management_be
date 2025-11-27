// backend/routes/resource.routes.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resource.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdminOrPM } = require('../middleware/role.middleware');

// Chỉ Admin và PM mới được xem tình hình nhân sự
router.get('/', authenticateToken, isAdminOrPM, resourceController.getResourceStatus);

module.exports = router;