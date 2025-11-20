const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdminOrPM } = require('../middleware/role.middleware'); // Import middleware quyền
const { isProjectMember, isProjectOwnerOrAdmin } = require('../middleware/projectAuth.middleware');
/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: API quản lý dự án
 */

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Tạo một dự án mới (Chỉ Admin/PM)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: [] # Yêu cầu JWT (đã login)
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
 *       '401':
 *         description: Chưa xác thực (chưa login).
 *       '403':
 *         description: Không có quyền (không phải Admin/PM).
 */
router.post(
    '/',
    authenticateToken, // 1. Phải login
    isAdminOrPM, // 2. Phải là Admin hoặc PM
    projectController.createProject
);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Lấy danh sách dự án của tôi
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: [] # Yêu cầu JWT (đã login)
 *     description: Trả về danh sách các dự án mà user hiện tại là thành viên.
 *     responses:
 *       '200':
 *         description: Danh sách dự án.
 *       '401':
 *         description: Chưa xác thực.
 */
router.get(
    '/',
    authenticateToken, // Chỉ cần login là được xem
    projectController.getMyProjects
);

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
 *         description: ID của dự án
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
 *                 example: member@example.com
 *     responses:
 *       '201':
 *         description: Thêm thành viên thành công.
 *       '400':
 *         description: Email không hợp lệ / User không tồn tại / User đã ở trong dự án.
 *       '403':
 *         description: Không có quyền (không phải Admin/PM).
 */
router.post(
    '/:projectId/members',
    authenticateToken,
    isAdminOrPM,       // Chỉ Admin/PM mới được thêm
    projectController.addMember
);

/**
 * @swagger
 * /projects/{projectId}/members:
 *   get:
 *     summary: Lấy danh sách nhân sự của dự án (Chỉ thành viên dự án)
 *     tags: [Projects]
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
 *         description: Danh sách thành viên.
 *       '403':
 *         description: Không phải thành viên của dự án.
 */
router.get(
    '/:projectId/members',
    authenticateToken,
    isProjectMember,   // Phải là thành viên mới được xem
    projectController.getMembers
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
 *                 example: COMPLETED
 *     responses:
 *       '200':
 *         description: Cập nhật thành công.
 *       '403':
 *         description: Không có quyền (không phải Admin hoặc chủ dự án).
 *       '404':
 *         description: Dự án không tồn tại.
 */
router.patch(
    '/:projectId',
    authenticateToken,
    isProjectOwnerOrAdmin, // 1. Phải là Admin hoặc chủ dự án
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
 *         description: Không có quyền (không phải Admin hoặc chủ dự án).
 *       '404':
 *         description: Dự án không tồn tại.
 */
router.delete(
    '/:projectId',
    authenticateToken,
    isProjectOwnerOrAdmin, // 1. Phải là Admin hoặc chủ dự án
    projectController.deleteProject
);

module.exports = router;