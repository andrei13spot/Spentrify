const notificationsService = require('../services/notificationsService');

async function getNotifications(req, res, next) {
  try {
    const userId = 1; // Default User
    const notifications = await notificationsService.getUserNotifications(userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const userId = 1; 
    const { id } = req.params;
    await notificationsService.deleteNotification(id, userId);
    res.json({ success: true, message: 'Notification removed' });
  } catch (error) {
    next(error);
  }
}

async function clearAll(req, res, next) {
  try {
    const userId = 1;
    await notificationsService.clearAllNotifications(userId);
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getNotifications, deleteNotification, clearAll };