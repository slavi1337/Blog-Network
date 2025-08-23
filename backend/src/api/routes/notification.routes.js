const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { ClerkExpressWithAuth } = require("../../config/clerk");

router.use(ClerkExpressWithAuth());

// DOHVATANJE NOTIFIKACIJA ZA KORISNIKA
router.get("/", notificationController.getAllNotifications);

// OZNACAVANJE SVIH NOTIFIKACIJA KAO PROCITANIH
router.post("/mark-as-read", notificationController.markAllAsRead);

// OZNACAVANJE JEDNE NOTIFIKACIJE KAO PROCITANE
router.put("/:notificationId/read", notificationController.markAsRead);

module.exports = router;
