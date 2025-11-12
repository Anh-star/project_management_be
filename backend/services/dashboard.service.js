// backend/services/dashboard.service.js
const dashboardModel = require('../models/dashboard.model');

/**
 * Lấy dữ liệu dashboard dựa trên vai trò của user
 */
const getDashboardData = async (user) => {
    const { id, role } = user;

    try {
        switch (role) {
            case 'ADMIN':
                return await dashboardModel.getAdminStats();
            
            case 'PM':
                return await dashboardModel.getPMStats(id);
                
            case 'MEMBER':
                return await dashboardModel.getMemberStats(id);
                
            default:
                throw new Error('Vai trò người dùng không xác định.');
        }
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu dashboard:", error);
        throw new Error('Không thể tải dữ liệu dashboard.');
    }
};

module.exports = {
    getDashboardData,
};