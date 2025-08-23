const express = require("express");
const router = express.Router();
const issueController = require("../controllers/issue.controller");
const { ClerkExpressWithAuth } = require("../../config/clerk");

// PRIJAVA PROBLEMA
router.post(
  "/",
  ClerkExpressWithAuth({ optional: true }),
  issueController.reportIssue
);

module.exports = router;
