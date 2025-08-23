const express = require("express");
const router = express.Router();
const mediaController = require("../controllers/media.controller");
const { ClerkExpressWithAuth } = require("../../config/clerk");

router.get("/upload-auth", mediaController.getUploadAuth);

router.post(
  "/media/details",
  ClerkExpressWithAuth(),
  mediaController.getMediaDetails
);

module.exports = router;
