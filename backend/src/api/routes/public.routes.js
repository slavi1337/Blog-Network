const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const usersController = require("../controllers/users.controller");

// RUTE ZA POSTOVE
router.get("/posts/featured", postController.getFeaturedPost);
router.get("/posts", postController.getPublicPosts);
router.get("/search", postController.searchPublicPosts);
router.get("/posts/:slug", postController.getPublicPostBySlug);

// RUTE ZA KORISNIKE
router.get("/search/users", usersController.searchPublicUsers);
router.get("/profiles/:username", usersController.getPublicProfileByUsername);

module.exports = router;
