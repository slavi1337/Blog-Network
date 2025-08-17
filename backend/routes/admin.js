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

  // DOHVATANJE SVIH KORISNIKA (BEZ ADMINA)
  router.get("/users", async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC"
      );
      res.status(200).json(rows);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Greška na serveru pri dohvatanju korisnika." });
    }
  });

  // DOHVATANJE SVIH ADMINA
  router.get("/admins", async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id, username, created_at FROM admins ORDER BY created_at DESC"
      );
      res.status(200).json(rows);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Greška na serveru pri dohvatanju administratora." });
    }
  });

  // PROMJENA ULOGE KORISNIKA (STANDARD<->MODERATOR)
  router.put("/users/:userId/role", async (req, res) => {
    const { userId } = req.params;
    const { newRole } = req.body;

    if (newRole !== "standard" && newRole !== "moderator") {
      return res.status(400).json({ error: "Nevažeća uloga." });
    }

    try {
      const result = await pool.query(
        "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role",
        [newRole, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      }

      res.status(200).json({
        message: `Uloga korisnika je uspješno promjenjena u "${newRole}".`,
        updatedUser: result.rows[0],
      });
    } catch (error) {
      console.error("Greška pri promjeni uloge korisnika:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  // BRISANJE KORISNICKOG NALOGA
  router.delete("/users/:userId", async (req, res) => {
    const { userId } = req.params;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // trazenje clerkida za brisanje globalno
      const userResult = await client.query(
        "SELECT clerk_id FROM users WHERE id = $1",
        [userId]
      );
      if (userResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ error: "Korisnik nije pronađen u lokalnoj bazi." });
      }
      const clerkId = userResult.rows[0].clerk_id;

      // brisanje korisnika iz nase baze i svih njegovih objava/kom
      await client.query("DELETE FROM users WHERE id = $1", [userId]);

      // brisanje sa clerka
      if (clerkId) {
        await clerkClient.users.deleteUser(clerkId);
      }

      await client.query("COMMIT");
      res.status(200).json({
        message: "Korisnik je uspješno obrisan iz baze i sa Clerk-a.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Greška pri brisanju korisnika:", error);
      if (error.status === 404) {
        res.status(404).json({
          error:
            "Korisnik nije pronađen na Clerk-u, ali je obrisan iz lokalne baze.",
        });
      } else {
        res.status(500).json({ error: "Greška na serveru." });
      }
    } finally {
      client.release();
    }
  });

  //brisanje adminskog naloga
  router.delete("/admins/:adminIdToDelete", async (req, res) => {
    const { adminIdToDelete } = req.params;
    const currentAdminId = req.session.adminId;

    // admin ne moze samog sb obrisati
    if (Number(adminIdToDelete) === currentAdminId) {
      return res
        .status(403)
        .json({ error: "Ne možete obrisati sopstveni nalog." });
    }

    try {
      const result = await pool.query("DELETE FROM admins WHERE id = $1", [
        adminIdToDelete,
      ]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Administrator nije pronađen." });
      }
      res.status(200).json({ message: "Administrator uspješno obrisan." });
    } catch (error) {
      console.error("Greška pri brisanju admina:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  // kreiranje novog administratorskog naloga
  router.post("/admins", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Korisničko ime i lozinka su obavezni." });
    }

    try {
      const existingAdmin = await pool.query(
        "SELECT id FROM admins WHERE username = $1",
        [username]
      );
      if (existingAdmin.rowCount > 0) {
        return res.status(409).json({
          error: "Administrator sa tim korisničkim imenom već postoji.",
        });
      }

      // hashovanje sifre
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await pool.query(
        "INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id, username",
        [username, passwordHash]
      );

      res.status(201).json({
        message: "Novi administrator je uspješno kreiran.",
        admin: result.rows[0],
      });
    } catch (error) {
      console.error("Greška pri kreiranju admina:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  // dohvatanje detalja problema
  router.get("/issues/:issueId", async (req, res) => {
    const { issueId } = req.params;
    try {
      const query = `
                SELECT 
                    ri.*, 
                    reporter.username AS reporter_username,
                    admin.username AS resolved_by_admin_username
                FROM reported_issues ri
                LEFT JOIN users reporter ON ri.reporter_user_id = reporter.id
                LEFT JOIN admins admin ON ri.resolved_by_admin_id = admin.id
                WHERE ri.id = $1
            `;
      const { rows } = await pool.query(query, [issueId]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Problem nije pronađen." });
      }
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Greška pri dohvatanju detalja problema:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  return router;
};

module.exports = adminRouter;
