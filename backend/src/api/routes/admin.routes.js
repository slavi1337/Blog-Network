const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { isAdmin } = require("../middleware/auth.middleware");

router.post("/login", adminController.login);
router.post("/logout", adminController.logout);

router.use(isAdmin);

// RUTE ZA PROBLEME
router.get("/issues", adminController.getAllIssues);
router.get("/issues/:issueId", adminController.getIssueDetails);
router.put("/issues/:issueId/status", adminController.updateIssueStatus);

// RUTE ZA KORISNIKE
router.get("/users", adminController.getAllUsers);
router.put("/users/:userId/role", adminController.updateUserRole);
router.delete("/users/:userId", adminController.deleteUser);

// RUTE ZA ADMINISTRATORE
router.get("/admins", adminController.getAllAdmins);
router.post("/admins", adminController.createAdmin);
router.delete("/admins/:adminIdToDelete", adminController.deleteAdmin);

// RUTE ZA CENZURISANE RIJECI
router.get("/censored-words", adminController.getCensoredWords);
router.post("/censored-words", adminController.addCensoredWord);
router.delete("/censored-words/:wordId", adminController.deleteCensoredWord);

// RUTE ZA KATEGORIJE
router.get("/categories", adminController.getAllCategories);
router.post("/categories", adminController.createCategory);
router.delete("/categories/:id", adminController.deleteCategory);

// RUTA ZA ANALITIKU
router.get("/analytics", adminController.getAdminAnalytics);

module.exports = router;
