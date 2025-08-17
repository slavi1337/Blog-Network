const express = require("express");
const bcrypt = require("bcrypt");

const { clerkClient } = require("@clerk/clerk-sdk-node");

const adminRouter = (pool) => {
  const router = express.Router();

  // --- RUTE ZA AUTENTIFIKACIJU ---

  // POST /api/admin/login
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const adminResult = await pool.query(
        "SELECT id, username, password_hash FROM admins WHERE username = $1",
        [username]
      );
      if (adminResult.rowCount === 0) {
        return res
          .status(401)
          .json({ error: "Pogrešno korisničko ime ili lozinka." });
      }

      const admin = adminResult.rows[0];
      const isMatch = await bcrypt.compare(password, admin.password_hash);

      if (isMatch) {
        req.session.adminId = admin.id;
        res.status(200).json({ message: "Uspješna prijava." });
      } else {
        res.status(401).json({ error: "Pogrešno korisničko ime ili lozinka." });
      }
    } catch (error) {
      console.error("Greška pri prijavi admina:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  // POST /api/admin/logout
  router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Neuspješno odjavljivanje." });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Uspješno ste odjavljeni." });
    });
  });

  // --- MIDDLEWARE ZA ZASTITU RUTA ---
  const isAdmin = (req, res, next) => {
    if (req.session && req.session.adminId) {
      next();
    } else {
      res.status(401).json({ error: "Niste autorizovani kao administrator." });
    }
  };

  router.use(isAdmin);
  // Sve rute ispod ove linije zasticene

  return router;
};

module.exports = adminRouter;
