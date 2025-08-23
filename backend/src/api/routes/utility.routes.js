const express = require("express");
const router = express.Router();
const utilityController = require("../controllers/utility.controller");

router.post("/translate", utilityController.translateText);

module.exports = router;
