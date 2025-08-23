const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");
const { ClerkExpressWithAuth } = require("../../config/clerk");

// OBJAVLJIVANJE/POSTAVLJANJE KOMENTARA
router.post("/", ClerkExpressWithAuth(), commentController.createComment);

// BRISANJE KOMENTARA
router.delete(
  "/:commentId",
  ClerkExpressWithAuth(),
  commentController.deleteComment
);

module.exports = router;
