// backend/routes/task.routes.js
const express = require('express');
// mergeParams: true để route này có thể truy cập :projectId từ route cha
const router = express.Router({ mergeParams: true }); 

const taskController = require('../controllers/task.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdminOrPM } = require('../middleware/role.middleware');
const { isProjectMember } = require('../middleware/projectAuth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Tasks
 *     description: API quản lý công việc
 */

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Tạo công việc mới trong dự án (Chỉ Admin/PM)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của dự án
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Thiết kế trang chủ
 *               description:
 *                 type: string
 *                 example: Cần hoàn thành UI/UX
 *               parent_id:
 *                 type: integer
 *                 example: 1 (ID của công việc cha)
 *               assignee_id:
 *                 type: integer
 *                 example: 5 (ID của user được giao)
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 example: '2025-11-20T17:00:00Z'
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 example: HIGH
 *     responses:
 *       '201':
 *         description: Tạo công việc thành công.
 *       '400':
 *         description: Thiếu tiêu đề hoặc người/việc cha không tồn tại.
 *       '403':
 *         description: Không có quyền (không phải Admin/PM).
 */
router.post(
    '/',
    authenticateToken,
    isAdminOrPM,       // Chỉ Admin/PM mới được *tạo*
    taskController.createTask
);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: Lấy toàn bộ cây công việc của dự án (Chỉ thành viên dự án)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của dự án
 *     responses:
 *       '200':
 *         description: Một mảng các công việc (dạng cây, có 'subTasks').
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   subTasks:
 *                     type: array
 *       '403':
 *         description: Không phải thành viên của dự án.
 */
router.get(
    '/',
    authenticateToken,
    isProjectMember,   // Chỉ thành viên dự án mới được *xem*
    taskController.getProjectTasks
);

module.exports = router;