const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const commentController = require("../../comment-service/controllers/comment.controller");
const { ClerkExpressWithAuth } = require("../../config/clerk");

// JAVNE RUTE
router.get("/:postId/comments", commentController.getCommentsForPost);

// ZASTICENE RUTE
router.use(ClerkExpressWithAuth());

router.get("/foryou", postController.getForYouFeed);
router.get("/saved", postController.getSavedPosts);
router.get("/history", postController.getReadingHistory);

router.post("/", postController.createPost);

router.get("/:slug/edit", postController.getPostForEdit);
router.delete("/:postId/draft", postController.deleteDraft);
router.get("/:postId/status", postController.getPostStatus);
router.put("/:postId/pin", postController.pinPost);
router.put("/:postId/unpin", postController.unpinPost);

router
  .route("/:postId/vote")
  .post(postController.voteOnPost)
  .delete(postController.removeVote);

router
  .route("/:postId/save")
  .post(postController.savePost)
  .delete(postController.unsavePost);

router
  .route("/:postId/history")
  .post(postController.addToHistory)
  .delete(postController.removeFromHistory);

router.put("/:postId", postController.updatePost);
router.delete("/:postId", postController.deletePost);
router.get("/:slug", postController.getPublicPostBySlug);

module.exports = router;
