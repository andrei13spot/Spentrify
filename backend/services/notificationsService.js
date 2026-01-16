const { query, run } = require('../database/connection');

// 1. GET ALL (Para makuha ng Frontend)
async function getNotifications(userId) {
  // Kunin ang latest muna (ORDER BY DESC)
  const sql = `SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC`;
  return await query(sql, [userId]);
}

// 2. CREATE (Para sa Auto-Add ng Transaction)
async function createNotification(userId, title, message) {
  const sql = `INSERT INTO Notifications (user_id, title, message) VALUES (?, ?, ?)`;
  return await run(sql, [userId, title, message]);
}

// 3. DELETE (Single)
async function deleteNotification(id, userId) {
  const sql = `DELETE FROM Notifications WHERE notification_id = ? AND user_id = ?`;
  const result = await run(sql, [id, userId]);
  return result.changes > 0;
}

// 4. DELETE ALL (Clear All)
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