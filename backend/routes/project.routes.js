// backend/routes/project.routes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdminOrPM } = require('../middleware/role.middleware');
const { isProjectMember, isProjectOwnerOrAdmin } = require('../middleware/projectAuth.middleware');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: API quản lý dự án và thành viên
 */

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Tạo một dự án mới (Chỉ Admin/PM)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dự án Website 2025
 *               project_code:
 *                 type: string
 *                 example: WEB2025
 *               description:
 *                 type: string
 *                 example: Xây dựng website thương mại điện tử
 *     responses:
 *       '201':
 *         description: Tạo dự án thành công.
 *       '400':
 *         description: Thiếu thông tin hoặc Mã dự án đã tồn tại.
 *       '403':
 *         description: Không có quyền (không phải Admin/PM).
 */
router.post(
    '/',
    authenticateToken,
    isAdminOrPM,
    projectController.createProject
);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Lấy danh sách dự án của tôi
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     description: Trả về danh sách các dự án mà user hiện tại là thành viên.
 *     responses:
 *       '200':
 *         description: Danh sách dự án.
 */
router.get(
    '/',
    authenticateToken,
    projectController.getMyProjects
);

/**
 * @swagger
 * /projects/{projectId}:
 *   patch:
 *     summary: Cập nhật dự án (Chỉ Admin/Chủ dự án)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [IN_PROGRESS, COMPLETED, ARCHIVED]
 *     responses:
 *       '200':
 *         description: Cập nhật thành công.
 *       '403':
 *         description: Không có quyền.
 */
router.patch(
    '/:projectId',
    authenticateToken,
    isProjectOwnerOrAdmin, // Chỉ Admin hoặc chủ dự án được sửa
    projectController.updateProject
);

/**
 * @swagger
 * /projects/{projectId}:
 *   delete:
 *     summary: Xóa dự án (Chỉ Admin/Chủ dự án)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Xóa thành công.
 *       '403':
 *         description: Không có quyền.
 */
router.delete(
    '/:projectId',
    authenticateToken,
    isProjectOwnerOrAdmin, // Chỉ Admin hoặc chủ dự án được xóa
    projectController.deleteProject
);

// --- QUẢN LÝ THÀNH VIÊN (MEMBERS) ---

/**
 * @swagger
 * /projects/{projectId}/members:
 *   post:
 *     summary: Thêm nhân sự vào dự án (Chỉ Admin/PM)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       '201':
 *         description: Thêm thành viên thành công.
 *       '400':
 *         description: Email không tồn tại hoặc đã là thành viên.
 */
router.post(
    '/:projectId/members',
    authenticateToken,
    isProjectOwnerOrAdmin, // Chỉ Admin/PM mới được thêm người
    projectController.addMember
);

/**
 * @swagger
 * /projects/{projectId}/members:
 *   get:
 *     summary: Lấy danh sách nhân sự của dự án
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Danh sách thành viên.
 *       '403':
 *         description: Không phải thành viên của dự án.
 */
router.get(
    '/:projectId/members',
    authenticateToken,
    isProjectMember, // Chỉ thành viên dự án mới được xem
    projectController.getMembers
);

/**
 * @swagger
 * /projects/{projectId}/members/{userId}:
 *   delete:
 *     summary: Xóa thành viên khỏi dự án (Chỉ Admin/Chủ dự án)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Đã xóa thành viên.
 *       '403':
 *         description: Không có quyền.
 */
router.delete(
    '/:projectId/members/:userId',
    authenticateToken,
    isProjectOwnerOrAdmin, // Chỉ Admin hoặc chủ dự án được xóa người
    projectController.removeMember
);

/**
 * @swagger
 * /projects/{projectId}/report:
 *     get:
 *      summary: Lấy báo cáo tiến độ dự án và thành viên
 *      tags: [Projects]
 *      security:
 *         - bearerAuth: []
 *      parameters:
 *         - in: path
 *           name: projectId
 *           required: true
 *           schema:
 *            type: integer
 *      responses:
 *       '200':
 *         description: Dữ liệu báo cáo chi tiết.
 */
router.get(
    '/:projectId/report',
    authenticateToken,
    isProjectMember, // Chỉ cần là thành viên là xem được
    projectController.getReport
);

module.exports = router;