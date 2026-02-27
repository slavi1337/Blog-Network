const bcrypt = require("bcrypt");
const { pool } = require("../../config/db");
const { clerkClient } = require("../../config/clerk");

// LOGIN ZA ADMINA
exports.login = async (req, res) => {
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
};

// LOGOUT ZA ADMINA
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Neuspješno odjavljivanje." });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Uspješno ste odjavljeni." });
  });
};

// DOHVATANJE SVIH PROBLEMA
exports.getAllIssues = async (req, res) => {
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
};

// DOHVATANJE DETALJA PROBLEMA
exports.getIssueDetails = async (req, res) => {
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
};

// AZURIRANJE STATUSA PROBLEMA
exports.updateIssueStatus = async (req, res) => {
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
};

// DOHVATANJE SVIH KORIS NIKA
exports.getAllUsers = async (req, res) => {
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
};

// PROMJENA ULOGE KORISNIKA (STANDARD<->MODERATOR)
exports.updateUserRole = async (req, res) => {
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
};

// BRISANJE KORISNICKOG NALOGA
exports.deleteUser = async (req, res) => {
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
};

// DOHVATANJE SVIH ADMINA
exports.getAllAdmins = async (req, res) => {
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
};

// KREIRANJE NOVOG ADMINSKOG NALOGA
exports.createAdmin = async (req, res) => {
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
};

// BRISANJE ADMINISTRATORSKOG NALOGA
exports.deleteAdmin = async (req, res) => {
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
};

// DOHVATANJE CENZURISANIH RIJECI
exports.getCensoredWords = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM censored_words ORDER BY word"
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).send();
  }
};

// DODAVANJE CENZURISANIH RIJECI
exports.addCensoredWord = async (req, res) => {
  const { word } = req.body;
  const adminId = req.session.adminId;
  if (!word) return res.status(400).json({ error: "Riječ je obavezna." });

  try {
    const result = await pool.query(
      "INSERT INTO censored_words (word, added_by_admin_id) VALUES ($1, $2) RETURNING *",
      [word.toLowerCase(), adminId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Ta riječ već postoji u listi." });
    }
    res.status(500).json({ error: "Greška na serveru." });
  }
};

// BRISANJE CENZURISANE RIJECI
exports.deleteCensoredWord = async (req, res) => {
  const { wordId } = req.params;
  try {
    await pool.query("DELETE FROM censored_words WHERE id = $1", [wordId]);
    res.status(200).json({ message: "Riječ uspješno obrisana." });
  } catch (error) {
    res.status(500).send();
  }
};

// DOHVATANJE SVIH KATEGORIJA
exports.getAllCategories = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM categories ORDER BY name");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).send();
  }
};

// KREIRANJE NOVE KATEGORIJE
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Ime kategorije je obavezno." });
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  try {
    const result = await pool.query(
      "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *",
      [name.trim(), slug]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Kategorija sa tim imenom već postoji." });
    }

    console.error("Greška pri dodavanju kategorije:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

// BRISANJE KATEGORIJE I PREMJESTANJE BLOGOVA IZ NJE U "OSTALO" KATEGORIJU
exports.deleteCategory = async (req, res) => {
  const { id: categoryIdToDelete } = req.params;
  const client = await pool.connect();

  try {
    const otherCategoryResult = await client.query(
      "SELECT id FROM categories WHERE name = 'Ostalo' LIMIT 1"
    );

    if (otherCategoryResult.rowCount === 0) {
      return res.status(500).json({
        error: 'Sistemska greška: Kategorija "Ostalo" nije pronađena.',
      });
    }
    const otherCategoryId = otherCategoryResult.rows[0].id;

    if (Number(categoryIdToDelete) === otherCategoryId) {
      return res.status(400).json({
        error: 'Ne možete obrisati podrazumijevanu kategoriju "Ostalo".',
      });
    }

    const categoryCheck = await client.query(
      "SELECT is_deletable FROM categories WHERE id = $1",
      [categoryIdToDelete]
    );
    if (
      categoryCheck.rowCount > 0 &&
      categoryCheck.rows[0].is_deletable === false
    ) {
      return res
        .status(400)
        .json({ error: "Ova kategorija se ne može obrisati." });
    }

    await client.query("BEGIN");

    await client.query(
      "UPDATE posts SET category_id = $1 WHERE category_id = $2",
      [otherCategoryId, categoryIdToDelete]
    );

    const deleteResult = await client.query(
      "DELETE FROM categories WHERE id = $1",
      [categoryIdToDelete]
    );

    if (deleteResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Kategorija nije pronađena." });
    }

    await client.query("COMMIT");

    res.status(200).json({
      message:
        'Kategorija uspješno obrisana. Svi blogovi su prebačeni u kategoriju "Ostalo".',
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Greška pri brisanju kategorije:", error);
    res.status(500).json({ error: "Greška na serveru." });
  } finally {
    client.release();
  }
};

// DOHVATANJE ANALITIKE ZA ADMIN DASHBOARD 
exports.getAdminAnalytics = async (req, res) => {
  // 1. Čitamo period koji šalje frontend (default je 7d)
  const { period } = req.query; 

  let interval = '7 days';
  let dateFormat = 'YYYY-MM-DD';

  if (period === '30d') {
    interval = '30 days';
  } else if (period === '12m') {
    interval = '1 year';
    dateFormat = 'YYYY-MM'; // Grupisanje po mjesecima da grafikon ne bude pretrpan
  }

  try {
    // Osnovni brojači
    const countsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM reported_issues WHERE status = 'new') as pending_issues,
        (SELECT COUNT(*) FROM comments) as total_comments
    `;
    const counts = await pool.query(countsQuery);

    // Popularnost kategorija
    const categoryQuery = `
      SELECT c.name, COUNT(p.id) as value
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id
      GROUP BY c.name
      HAVING COUNT(p.id) > 0
    `;
    const categories = await pool.query(categoryQuery);

    // --- KLJUČNA IZMJENA: Dinamički interval i format datuma ---
    const activityQuery = `
      SELECT TO_CHAR(created_at, '${dateFormat}') as date, COUNT(*) as count
      FROM posts
      WHERE created_at > NOW() - INTERVAL '${interval}'
      GROUP BY date
      ORDER BY date ASC
    `;
    const activity = await pool.query(activityQuery);

    // Top 5 najčitanijih tekstova
    const topPostsQuery = `SELECT title, view_count FROM posts ORDER BY view_count DESC LIMIT 5`;
    const topPosts = await pool.query(topPostsQuery);

    // Najaktivniji autori
    const topAuthorsQuery = `
      SELECT u.username, COUNT(p.id) as count
      FROM users u
      JOIN posts p ON u.id = p.author_id
      GROUP BY u.username
      ORDER BY count DESC
      LIMIT 5
    `;
    const topAuthors = await pool.query(topAuthorsQuery);

    // Odnos problema
    const issuesStatusQuery = `SELECT status, COUNT(*) as value FROM reported_issues GROUP BY status`;
    const issuesStatus = await pool.query(issuesStatusQuery);

    res.status(200).json({
      summary: counts.rows[0],
      categoryData: categories.rows,
      activityData: activity.rows,
      topPosts: topPosts.rows,
      topAuthors: topAuthors.rows,
      issuesStatus: issuesStatus.rows
    });
  } catch (error) {
    console.error("Greška pri dohvatanju analitike:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

