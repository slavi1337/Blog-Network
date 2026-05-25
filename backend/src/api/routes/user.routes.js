const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { ClerkExpressWithAuth } = require("../../config/clerk");

router.use(ClerkExpressWithAuth());

  
router.get("/stats/me", userController.getUserStats);

router.put(
  "/:userId/follow/notifications",
  userController.updateFollowNotifications
);

router
  .route("/:userId/follow")
  .post(userController.followUser)
  .delete(userController.unfollowUser);

router
  .route("/:userId/block")
  .post(userController.blockUser)
  .delete(userController.unblockUser);



module.exports = router;
