const db = require('../config/db');
const projectModel = require('../models/project.model');
/**
 * Middleware kiểm tra xem user (đã login) có phải là thành viên
 * của dự án (từ req.params.projectId) hay không.
 */
const isProjectMember = async (req, res, next) => {
    try {
        if (req.user.role === 'ADMIN') {
            return next();
        }
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

/**
 * Middleware kiểm tra quyền SỬA/XÓA dự án.
 * - ADMIN: Được phép.
 * - PM: Chỉ được phép nếu HỌ TẠO RA dự án đó.
 */
const isProjectOwnerOrAdmin = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const user = req.user;

        // ADMIN có toàn quyền
        if (user.role === 'ADMIN') {
            return next();
        }

        // Nếu là PM, kiểm tra xem có phải chủ dự án không
        if (user.role === 'PM') {
            const project = await projectModel.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Dự án không tồn tại.' });
            }
            
            if (project.created_by === user.id) {
                return next(); // Là chủ dự án, được phép
            }
        }
        
        // Không phải ADMIN, cũng không phải chủ dự án
        return res.status(403).json({ 
            message: 'Bạn không có quyền sửa/xóa dự án này.' 
        });
        
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi kiểm tra quyền sở hữu dự án.' });
    }
};

// Cập nhật module.exports
module.exports = { 
    isProjectMember,
    isProjectOwnerOrAdmin, // <-- Thêm dòng này
};