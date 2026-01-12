// backend/services/notificationsService.js

const { query, run } = require('../database/connection');

// Create a new notification
async function createNotification(userId, title, message) {
  const sql = `
    INSERT INTO Notifications (user_id, title, message)
    VALUES (?, ?, ?)
  `;
  try {
    await run(sql, [userId, title, message]);
  } catch (error) {
    console.error("Failed to save notification:", error);
    // Don't throw error to prevent crashing the main transaction
  }
}

// Get all notifications
async function getUserNotifications(userId) {
  const sql = `
    SELECT * FROM Notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `;
  const rows = await query(sql, [userId]);
  
  return rows.map(row => ({
    id: row.notification_id.toString(),
    title: row.title,
    message: row.message,
    date: new Date(row.created_at).toLocaleString(),
    is_read: row.is_read
  }));
}

async function deleteNotification(id, userId) {
  const sql = `DELETE FROM Notifications WHERE notification_id = ? AND user_id = ?`;
  await run(sql, [id, userId]);
}

async function clearAllNotifications(userId) {
  const sql = `DELETE FROM Notifications WHERE user_id = ?`;
  await run(sql, [userId]);
}

module.exports = {
  createNotification,
  getUserNotifications,
  deleteNotification,
  clearAllNotifications
};