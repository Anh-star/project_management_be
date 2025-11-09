// backend/middleware/projectAuth.middleware.js
const db = require('../config/db');

/**
 * Middleware kiểm tra xem user (đã login) có phải là thành viên
 * của dự án (từ req.params.projectId) hay không.
 */
const isProjectMember = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id; // Lấy từ authenticateToken

        const query = `
            SELECT 1 FROM project_members
            WHERE project_id = $1 AND user_id = $2
        `;
        const { rows } = await db.query(query, [projectId, userId]);

        if (rows.length === 0) {
            // 403 Forbidden - không phải thành viên
            return res.status(403).json({ 
                message: 'Bạn không phải là thành viên của dự án này.' 
            });
        }
        
        // Là thành viên, cho phép đi tiếp
        next();

    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi kiểm tra quyền dự án.' });
    }
};

module.exports = { isProjectMember };