const notificationsService = require('../services/notificationsService');

// GET
async function getNotifications(req, res) {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });

    const data = await notificationsService.getNotifications(userId);
    res.json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// DELETE SINGLE
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.query.user_id;
    await notificationsService.deleteNotification(id, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// DELETE ALL
async function deleteAllNotifications(req, res) {
  try {
    const userId = req.query.user_id;
    await notificationsService.deleteAllNotifications(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getNotifications,
  deleteNotification,
  deleteAllNotifications
};