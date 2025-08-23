const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook.controller");
const bodyParser = require("body-parser");

router.post(
  "/clerk",
  bodyParser.raw({ type: "application/json" }),
  webhookController.handleClerkWebhook
);

module.exports = router;
