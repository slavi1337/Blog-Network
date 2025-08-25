const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook.controller");

router.post("/clerk", webhookController.handleClerkWebhook);

module.exports = router;
