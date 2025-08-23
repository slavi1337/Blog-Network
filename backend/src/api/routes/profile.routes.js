const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { ClerkExpressWithAuth } = require("../../config/clerk");

router.use(ClerkExpressWithAuth());

router.get("/me", userController.getCurrentUserProfile);
router.get("/drafts", userController.getDrafts);

router
  .route("/interests")
  .get(userController.getInterests)
  .put(userController.updateInterests);

router
  .route("/moderators")
  .get(userController.getModerators)
  .post(userController.addModerator);
router.delete("/moderators/:moderatorId", userController.removeModerator);

router.get("/following", userController.getFollowing);
router.get("/followers", userController.getFollowers);

// TUDJI PROFIL
router.get("/:username/status", userController.getProfileStatus);

module.exports = router;
