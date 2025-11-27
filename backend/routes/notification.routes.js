const express = require('express');
const router = express.Router();
const notiController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth.middleware');


router.delete('/:id', notiController.deleteNotification);
router.use(authenticateToken);
router.get('/', notiController.getMyNotifications);
router.patch('/:id/read', notiController.markRead);
router.patch('/read-all', notiController.markAllRead);

module.exports = router;