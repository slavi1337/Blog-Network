const { pool } = require("../../config/db");

// PRETRAGA KORISNIKA
exports.searchPublicUsers = async (req, res) => {
  const { search } = req.query;

  if (!search || search.trim() === "") {
    return res.status(200).json([]);
  }

  try {
    const query = `
      SELECT id, username, profile_picture_url, first_name, last_name
      FROM users
      WHERE username ILIKE '%' || $1 || '%'
      ORDER BY username
      LIMIT 20; -- Ograničavamo broj rezultata radi boljih performansi
    `;
    const { rows } = await pool.query(query, [search]);
    res.json(rows);
  } catch (error) {
    console.error("Greška pri pretrazi korisnika:", error);
    res
      .status(500)
      .json({ error: "Greška na serveru prilikom pretrage korisnika." });
  }
};

// DOHVATANJE PROFILA ZA NEPRIJAVLJENOG KORISNIKA
exports.getPublicProfileByUsername = async (req, res) => {
  const { username } = req.params;
  try {
    const profileQuery = `
            SELECT
                u.id, u.username, u.first_name, u.last_name, u.profile_picture_url, u.created_at,
                (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.status = 'published') AS post_count,
                (SELECT COUNT(*) FROM followers f WHERE f.follower_id = u.id) AS following_count,
                (SELECT COUNT(*) FROM followers f WHERE f.followed_id = u.id) AS followers_count
            FROM users u
            WHERE u.username = $1;
        `;
    const profileResult = await pool.query(profileQuery, [username]);
    if (profileResult.rowCount === 0)
      return res.status(404).json({ error: "Korisnik nije pronađen." });

    const profileData = profileResult.rows[0];
    const userId = profileData.id;

    const postsQuery = `
            SELECT p.id, p.title, p.slug, p.created_at, u.username as author_username, p.is_pinned, p.view_count
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.author_id = $1 AND p.status = 'published'
            ORDER BY p.is_pinned DESC, p.created_at DESC;
        `;
    const postsResult = await pool.query(postsQuery, [userId]);

    res.status(200).json({ ...profileData, posts: postsResult.rows });
  } catch (error) {
    console.error("Greška pri dohvatanju javnog profila:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};
