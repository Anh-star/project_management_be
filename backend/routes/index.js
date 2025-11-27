// backend/routes/index.js
const express = require('express');
const router = express.Router();
const resourceRoutes = require('./resource.routes');
// Import các route
const authRoutes = require('./auth.routes');
const projectRoutes = require('./project.routes');
const taskRoutes = require('./task.routes');
const dashboardRoutes = require('./dashboard.routes');
const userRoutes = require('./user.routes');
const notificationRoutes = require('./notification.routes');
// Router test sức khỏe
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'API is running!' });
});

// Gắn auth routes
// Mọi request đến /api/v1/auth/... sẽ được xử lý bởi authRoutes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
// (Sau này bạn sẽ thêm các route khác vào đây)
// const projectRoutes = require('./project.routes');
// router.use('/projects', projectRoutes);
router.use('/projects/:projectId/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/resources', resourceRoutes);
router.use('/notifications', notificationRoutes);
module.exports = router;