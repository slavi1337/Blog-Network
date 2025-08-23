const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");

router.get("/categories", categoryController.getAllCategories);
router.get("/tags", categoryController.getAllTags);

module.exports = router;
