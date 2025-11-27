const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdminOrPM } = require('../middleware/role.middleware');
const { isProjectMember, isProjectManagerOrAdmin } = require('../middleware/projectAuth.middleware');

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
 *     summary: Tạo dự án mới (Kèm danh sách Manager)
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
 *               project_code:
 *                 type: string
 *               description:
 *                 type: string
 *               manager_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       '201':
 *         description: Tạo thành công.
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
 *     summary: Lấy danh sách dự án (Hỗ trợ ?search=...&status=...)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mã
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái (IN_PROGRESS, COMPLETED)
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
 *     summary: Cập nhật dự án (Chỉ Manager/Admin)
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
 *     responses:
 *       '200':
 *         description: Cập nhật thành công.
 */
router.patch(
    '/:projectId',
    authenticateToken,
    isProjectManagerOrAdmin,
    projectController.updateProject
);

/**
 * @swagger
 * /projects/{projectId}:
 *   delete:
 *     summary: Xóa dự án (Chỉ Manager/Admin)
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
 */
router.delete(
    '/:projectId',
    authenticateToken,
    isProjectManagerOrAdmin,
    projectController.deleteProject
);

/**
 * @swagger
 * /projects/{projectId}/members:
 *   post:
 *     summary: Thêm thành viên vào dự án
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Thêm thành công.
 */
router.post(
    '/:projectId/members',
    authenticateToken,
    isProjectManagerOrAdmin,
    projectController.addMember
);

/**
 * @swagger
 * /projects/{projectId}/members:
 *   get:
 *     summary: Lấy danh sách thành viên
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Danh sách thành viên kèm quyền hạn.
 */
router.get(
    '/:projectId/members',
    authenticateToken,
    isProjectMember,
    projectController.getMembers
);

/**
 * @swagger
 * /projects/{projectId}/members/{userId}:
 *   delete:
 *     summary: Xóa thành viên khỏi dự án
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Đã xóa thành viên.
 */
router.delete(
    '/:projectId/members/:userId',
    authenticateToken,
    isProjectManagerOrAdmin,
    projectController.removeMember
);

/**
 * @swagger
 * /projects/{projectId}/report:
 *   get:
 *     summary: Lấy báo cáo tiến độ
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Dữ liệu báo cáo.
 */
router.get(
    '/:projectId/report',
    authenticateToken,
    isProjectMember,
    projectController.getReport
);

module.exports = router;
