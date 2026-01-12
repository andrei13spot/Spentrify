const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

// Define Routes
router.get('/', notificationsController.getNotifications);
router.delete('/:id', notificationsController.deleteNotification);
router.delete('/', notificationsController.clearAll);

module.exports = router;