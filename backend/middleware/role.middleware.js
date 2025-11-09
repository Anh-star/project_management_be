// backend/middleware/role.middleware.js

/**
 * Factory function để tạo middleware kiểm tra vai trò.
 * @param {Array<string>} roles - Mảng các vai trò được phép (ví dụ: ['ADMIN', 'PM'])
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        // req.user được gán từ middleware authenticateToken
        if (!req.user || !roles.includes(req.user.role)) {
            // 403 Forbidden (Bị cấm)
            return res.status(403).json({ 
                message: 'Bạn không có quyền thực hiện hành động này.' 
            });
        }
        
        // Nếu quyền hợp lệ, đi tiếp
        next();
    };
};

// Tạo ra các middleware cụ thể để dễ sử dụng
const isAdmin = checkRole(['ADMIN']);
const isPM = checkRole(['PM']);
const isAdminOrPM = checkRole(['ADMIN', 'PM']);

module.exports = {
    checkRole,
    isAdmin,
    isPM,
    isAdminOrPM,
};