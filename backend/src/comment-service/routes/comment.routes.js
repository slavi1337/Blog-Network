const express = require("express");
const router = express.Router();

const commentController = require("../controllers/comment.controller");

const { ClerkExpressWithAuth } = require("../../config/clerk");

// CREATE COMMENT
router.post("/", ClerkExpressWithAuth(), commentController.createComment);

// DELETE COMMENT
router.delete("/:commentId", ClerkExpressWithAuth(), commentController.deleteComment);

// GET COMMENTS FOR POST
router.get("/post/:postId", commentController.getCommentsForPost);

module.exports = router;