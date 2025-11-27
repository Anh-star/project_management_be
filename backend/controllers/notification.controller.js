const notiModel = require('../models/notification.model');

const getMyNotifications = async (req, res) => {
    try {
        const list = await notiModel.getByUserId(req.user.id);
        res.status(200).json(list);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

const markRead = async (req, res) => {
    try {
        await notiModel.markAsRead(req.params.id);
        res.status(200).json({ message: 'OK' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

const markAllRead = async (req, res) => {
    try {
        await notiModel.markAllAsRead(req.user.id);
        res.status(200).json({ message: 'OK' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

const deleteNotification = async (req, res) => {
    try {
        await notiModel.deleteById(req.params.id);
        res.status(200).json({ message: 'Đã xóa thông báo' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { 
    getMyNotifications, 
    markRead, 
    markAllRead,
    deleteNotification,
};