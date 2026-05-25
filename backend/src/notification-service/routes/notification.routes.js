const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");

const { ClerkExpressWithAuth } = require("../../config/clerk");

router.use(ClerkExpressWithAuth());

// DOHVATANJE NOTIFIKACIJA
router.get("/", notificationController.getAllNotifications);

// OZNACI SVE KAO PROCITANO
router.post("/mark-as-read", notificationController.markAllAsRead);

// OZNACI JEDNU
router.put("/:notificationId/read", notificationController.markAsRead);

module.exports = router;