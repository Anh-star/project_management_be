const dashboardService = require('../services/dashboard.service');

const getDashboard = async (req, res) => {
    try {
        // req.user được gán từ 'authenticateToken'
        const data = await dashboardService.getDashboardData(req.user);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboard,
};