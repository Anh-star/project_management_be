const dashboardModel = require('../models/dashboard.model');
const userModel = require('../models/user.model');

const getDashboardData = async (user, targetUserId = null) => {
    // Nếu là Admin và muốn xem người khác
    if (user.role === 'ADMIN' && targetUserId) {
        const targetUser = await userModel.findById(targetUserId);
        if (!targetUser) throw new Error('Người dùng không tồn tại');

        // Gọi hàm thống kê tương ứng với Role của người được xem
        if (targetUser.role === 'MEMBER') return await dashboardModel.getMemberStats(targetUserId);
        if (targetUser.role === 'PM') return await dashboardModel.getPMStats(targetUserId);
        if (targetUser.role === 'ADMIN') return await dashboardModel.getAdminStats(); 
    }

    switch (user.role) {
        case 'ADMIN': return await dashboardModel.getAdminStats();
        case 'PM': return await dashboardModel.getPMStats(user.id);
        case 'MEMBER': return await dashboardModel.getMemberStats(user.id);
        default: return {};
    }
};

module.exports = { getDashboardData };