const dashboardService = require('../services/dashboard.service');

const getDashboard = async (req, res) => {
    try {
        const { userId } = req.query; // Lấy param ?userId=...
        const data = await dashboardService.getDashboardData(req.user, userId);
        res.status(200).json(data);
    } catch (error) { 
        res.status(500).json({ message: error.message }); }
};

module.exports = {
    getDashboard,
};