const { query, run } = require('../database/connection');

// GET ALL 
async function getNotifications(userId) {
  const sql = `SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC`;
  return await query(sql, [userId]);
}

// CREATE
async function createNotification(userId, title, message) {
  const sql = `INSERT INTO Notifications (user_id, title, message) VALUES (?, ?, ?)`;
  return await run(sql, [userId, title, message]);
}

// DELETE 
async function deleteNotification(id, userId) {
  const sql = `DELETE FROM Notifications WHERE notification_id = ? AND user_id = ?`;
  const result = await run(sql, [id, userId]);
  return result.changes > 0;
}

// DELETE ALL 
async function deleteAllNotifications(userId) {
  const sql = `DELETE FROM Notifications WHERE user_id = ?`;
  return await run(sql, [userId]);
}

module.exports = {
  getNotifications,
  createNotification,
  deleteNotification,
  deleteAllNotifications
};