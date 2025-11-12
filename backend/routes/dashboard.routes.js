// backend/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: API tổng quan và báo cáo
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Lấy dữ liệu dashboard tổng quan
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: [] # Yêu cầu JWT (đã login)
 *     description: |
 *       Trả về dữ liệu thống kê (dự án, công việc)
 *       dựa trên vai trò của người dùng đã đăng nhập.
 *       - **ADMIN**: Thấy tất cả.
 *       - **PM**: Thấy dự án/công việc mình quản lý.
 *       - **MEMBER**: Thấy dự án mình tham gia / công việc mình được gán.
 *     responses:
 *       '200':
 *         description: Dữ liệu thống kê.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scope:
 *                   type: string
 *                   example: "ADMIN"
 *                 projects:
 *                   type: object
 *                   properties:
 *                     total_projects:
 *                       type: string
 *                       example: "10"
 *                     completed_projects:
 *                       type: string
 *                       example: "5"
 *                 tasks:
 *                   type: object
 *                   properties:
 *                     total_tasks:
 *                       type: string
 *                       example: "100"
 *                     overdue_tasks:
 *                       type: string
 *                       example: "8"
 *       '401':
 *         description: Chưa xác thực.
 */
router.get(
    '/',
    authenticateToken, // Chỉ cần login là xem được
    dashboardController.getDashboard
);

module.exports = router;