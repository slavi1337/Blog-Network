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

  // GET /api/admin/issues
  router.get("/issues", async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM reported_issues ORDER BY created_at DESC"
      );
      res.status(200).json(rows);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Greška na serveru pri dohvatanju problema." });
    }
  });

  // Promjena statusa problema
  router.put("/issues/:issueId/status", async (req, res) => {
    const { issueId } = req.params;
    const { newStatus } = req.body;
    const adminId = req.session.adminId;

    const validStatuses = ["in_progress", "resolved", "rejected"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: "Nevažeći status." });
    }

    try {
      const result = await pool.query(
        `UPDATE reported_issues 
             SET status = $1, resolved_at = NOW(), resolved_by_admin_id = $2 
             WHERE id = $3 RETURNING reporter_user_id`,
        [newStatus, adminId, issueId]
      );

      if (result.rowCount === 0)
        return res.status(404).json({ error: "Problem nije pronađen." });

      const { reporter_user_id } = result.rows[0];
      if (reporter_user_id) {
        await pool.query(
          `INSERT INTO notifications (recipient_id, type, related_entity_id) 
                 VALUES ($1, 'issue_status_change', $2)`,
          [reporter_user_id, issueId]
        );
      }
      res.status(200).json({ message: `Status problema je ažuriran.` });
    } catch (error) {
      console.error("Greška pri ažuriranju statusa problema:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  return router;
};

module.exports = adminRouter;
