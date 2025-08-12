require("dotenv").config();
const express = require("express");
const { Webhook } = require("svix");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const { ClerkExpressWithAuth, clerkClient } = require("@clerk/clerk-sdk-node");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL nije definisan u .env fajlu");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());

const getInternalUserId = async (clerkId) => {
  if (!clerkId) return null;
  const result = await pool.query("SELECT id FROM users WHERE clerk_id = $1", [
    clerkId,
  ]);
  return result.rows.length > 0 ? result.rows[0].id : null;
};

// --- API RUTA ZA KREIRANJE NOVOG POSTA ---
app.post("/api/posts", ClerkExpressWithAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });

  const { title, categoryId, content, tags } = req.body;

  if (!title || !content || !categoryId || !tags) {
    return res
      .status(400)
      .json({ error: "Naslov, sadržaj, kategorija i tagovi su obavezni." });
  }

  try {
    const authorId = await getInternalUserId(clerkId);
    if (!authorId) {
      return res.status(404).json({ error: "Korisnik nije pronađen u bazi." });
    }

    const slugBase = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const slug = `${slugBase}-${Date.now()}`;

    const query = `
      INSERT INTO posts (author_id, category_id, title, slug, content, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'published', NOW(), NOW())
      RETURNING id, slug;
    `;
    const values = [authorId, categoryId, title, slug, content];
    const newPost = await pool.query(query, values);
    const newPostId = newPost.rows[0].id;

    const listaTagova = tags
      .split(/\s+/)
      .map((t) => t.replace(/^#/, ""))
      .filter((t) => t.length > 0);

    for (const tagName of listaTagova) {
      let { rows } = await pool.query("SELECT id FROM tags WHERE name = $1", [
        tagName,
      ]);
      let tagId;

      if (rows.length > 0) {
        tagId = rows[0].id;
      } else {
        const rezultatInserta = await pool.query(
          "INSERT INTO tags (name) VALUES ($1) RETURNING id",
          [tagName]
        );
        tagId = rezultatInserta.rows[0].id;
      }

      await pool.query(
        "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)",
        [newPostId, tagId]
      );
    }

    res.status(201).json({
      message: "Post uspešno kreiran!",
      post: newPost.rows[0],
    });
  } catch (error) {
    console.error("Greška pri kreiranju posta:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// DOHVATANJE OBJAVE IZ BAZE
app.get("/api/public/posts/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const postQuery = `
          SELECT 
          p.id, p.title, p.slug, p.content, p.created_at, p.updated_at,
          u.username AS author_username,
          c.name AS category_name,
          c.id AS category_id, -- Vraćamo i ID kategorije za lakše popunjavanje forme
          (SELECT COALESCE(SUM(vote_type), 0) FROM post_votes WHERE post_id = p.id) AS vote_score,
          STRING_AGG(t.name, ' ') AS tags
          FROM posts p
          JOIN users u ON p.author_id = u.id
          JOIN categories c ON p.category_id = c.id
          LEFT JOIN post_tags pt ON p.id = pt.post_id
          LEFT JOIN tags t ON pt.tag_id = t.id
          WHERE p.slug = $1 AND p.status = 'published'
          GROUP BY p.id, u.id, c.id;
        `;

    const postResult = await pool.query(postQuery, [slug]);

    if (postResult.rowCount === 0) {
      return res.status(404).json({ error: "Post nije pronađen." });
    }

    res.json(postResult.rows[0]);
  } catch (error) {
    console.error("Greška pri dohvatanju javnog posta:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

app.put("/api/posts/:postId", ClerkExpressWithAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  const { postId } = req.params;
  const { title, categoryId, content, tags } = req.body;

  if (!title || !content || !categoryId) {
    return res
      .status(400)
      .json({ error: "Naslov, sadržaj i kategorija su obavezni." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const internalUserId = await getInternalUserId(clerkId);
    if (!internalUserId) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    const postResult = await client.query(
      "SELECT author_id FROM posts WHERE id = $1",
      [postId]
    );
    if (postResult.rowCount === 0) {
      return res.status(404).json({ error: "Post nije pronađen." });
    }
    if (postResult.rows[0].author_id !== internalUserId) {
      return res
        .status(403)
        .json({ error: "Nemate dozvolu da menjate ovaj post." });
    }

    await client.query(
      `UPDATE posts SET title = $1, category_id = $2, content = $3, updated_at = NOW() WHERE id = $4`,
      [title, categoryId, content, postId]
    );

    await client.query("DELETE FROM post_tags WHERE post_id = $1", [postId]);

    const listaTagova = (tags || "")
      .split(/\s+/)
      .map((t) => t.replace(/^#/, ""))
      .filter((t) => t.length > 0);

    for (const tagName of listaTagova) {
      let { rows } = await client.query("SELECT id FROM tags WHERE name = $1", [
        tagName,
      ]);
      let tagId;
      if (rows.length > 0) {
        tagId = rows[0].id;
      } else {
        const rezultatInserta = await client.query(
          "INSERT INTO tags (name) VALUES ($1) RETURNING id",
          [tagName]
        );
        tagId = rezultatInserta.rows[0].id;
      }
      await client.query(
        "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)",
        [postId, tagId]
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Post je uspešno ažuriran." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Greška pri ažuriranju posta:", error);
    res.status(500).json({ error: "Greška na serveru." });
  } finally {
    client.release();
  }
});

app.get(
  "/api/posts/:postId/status",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;

    try {
      const internalUserId = await getInternalUserId(clerkId);
      if (!internalUserId) {
        return res
          .status(404)
          .json({ error: "Korisnik nije pronađen u bazi." });
      }

      const statusQuery = `
            SELECT 
                (SELECT vote_type FROM post_votes WHERE post_id = $1 AND user_id = $2) AS user_vote,
                (SELECT EXISTS (SELECT 1 FROM saved_posts WHERE post_id = $1 AND user_id = $2)) AS is_saved
        `;

      const statusResult = await pool.query(statusQuery, [
        postId,
        internalUserId,
      ]);

      res.json(statusResult.rows[0]);
    } catch (error) {
      console.error("Greška pri dohvatanju statusa posta:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// --- glasanje ruta
app.post(
  "/api/posts/:postId/vote",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;
    const { voteType } = req.body;

    if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });
    if (![1, -1].includes(voteType)) {
      return res.status(400).json({ error: "Nevažeći tip glasa." });
    }

    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      const voteQuery = `
            INSERT INTO post_votes (user_id, post_id, vote_type)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, post_id) DO UPDATE
            SET vote_type = $3;
        `;
      await pool.query(voteQuery, [userId, postId, voteType]);

      const scoreResult = await pool.query(
        "SELECT COALESCE(SUM(vote_type), 0) AS new_score FROM post_votes WHERE post_id = $1",
        [postId]
      );

      res.status(200).json({ newScore: scoreResult.rows[0].new_score });
    } catch (error) {
      console.error("Greška pri glasanju:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// --- API RUTA ZA UKLANJANJE GLASA ---
app.delete(
  "/api/posts/:postId/vote",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;

    if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });

    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      await pool.query(
        "DELETE FROM post_votes WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      const scoreResult = await pool.query(
        "SELECT COALESCE(SUM(vote_type), 0) AS new_score FROM post_votes WHERE post_id = $1",
        [postId]
      );

      res.status(200).json({ newScore: scoreResult.rows[0].new_score });
    } catch (error) {
      console.error("Greška pri uklanjanju glasa:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// OBJAVLJIVANJE KOMENTARA NA OBJAVU/kom
app.post("/api/comments", ClerkExpressWithAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  const { postId, content, parentCommentId } = req.body;

  if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });
  if (!postId || !content) {
    return res.status(400).json({ error: "ID posta i sadržaj su obavezni." });
  }

  try {
    const userId = await getInternalUserId(clerkId);
    if (!userId) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    const query = `
       INSERT INTO comments (post_id, user_id, content, parent_comment_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, post_id, user_id, content, parent_comment_id, created_at
    `;
    const values = [postId, userId, content, parentCommentId || null];
    const result = await pool.query(query, values);
    const newComment = result.rows[0];

    const user = await clerkClient.users.getUser(clerkId);
    const fullCommentData = {
      ...newComment,
      username: user.username,
      profile_picture_url: user.imageUrl,
    };

    res.status(201).json({
      message: "Komentar uspešno dodat.",
      comment: fullCommentData,
    });
  } catch (err) {
    console.error("Greška pri dodavanju komentara:", err);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// ---DOHVATANJE SVIH KOMENTARA ZA OBJAVU ---
app.get("/api/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  try {
    const query = `
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.parent_comment_id,
        c.content,
        c.created_at,
        u.username,
        u.profile_picture_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC;
    `;
    const { rows } = await pool.query(query, [postId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju komentara:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// DOHVATANJE KATEGORIJA IZ BAZE
app.get("/api/categories", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name FROM categories ORDER BY name ASC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju kategorija:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

app.get(
  "/api/profiles/:username",
  ClerkExpressWithAuth({ optional: true }),
  async (req, res) => {
    const { username } = req.params;
    const viewerClerkId = req.auth.userId; // ID onog ko gleda profil (može biti null)

    try {
      const viewerId = await getInternalUserId(viewerClerkId);

      // 1. Pronađi korisnika po korisničkom imenu i dohvati njegove podatke i statuse
      const profileQuery = `
            SELECT
                u.id, u.username, u.first_name, u.last_name, u.profile_picture_url, u.created_at,
                (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.status = 'published') AS post_count,
                (SELECT COUNT(*) FROM followers f WHERE f.follower_id = u.id) AS following_count,
                (SELECT COUNT(*) FROM followers f WHERE f.followed_id = u.id) AS followers_count,
                -- Novi deo: Provera da li ga ulogovani korisnik prati
                EXISTS(SELECT 1 FROM followers WHERE follower_id = $2 AND followed_id = u.id) as is_followed_by_viewer,
                -- Novi deo: Provera da li ga je ulogovani korisnik blokirao
                EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $2 AND blocked_id = u.id) as is_blocked_by_viewer
            FROM users u
            WHERE u.username = $1;
        `;
      const profileResult = await pool.query(profileQuery, [
        username,
        viewerId,
      ]);

      if (profileResult.rowCount === 0) {
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      }

      const profileData = profileResult.rows[0];
      const userId = profileData.id;

      // 2. Dohvati sve objave tog korisnika
      const postsQuery = `
            SELECT p.id, p.title, p.slug, p.cover_media_id, p.created_at, u.username as author_username
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.author_id = $1 AND p.status = 'published'
            ORDER BY p.created_at DESC;
        `;
      const postsResult = await pool.query(postsQuery, [userId]);

      const fullProfile = {
        ...profileData,
        posts: postsResult.rows,
      };

      res.status(200).json(fullProfile);
    } catch (error) {
      console.error("Greška pri dohvatanju profila:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// PRIKAZ VLASTITOG PROFILA
app.get("/api/profile/me", ClerkExpressWithAuth(), async (req, res) => {
  if (!req.auth.userId) {
    return res.status(401).json({ error: "Niste autorizovani." });
  }
  const clerkId = req.auth.userId;

  try {
    const internalUserId = await getInternalUserId(clerkId);
    if (!internalUserId) {
      return res
        .status(404)
        .json({ error: "Korisnik nije pronađen u našoj bazi." });
    }

    const profileQuery = `
      SELECT
          u.id, u.username, u.first_name, u.last_name, u.profile_picture_url, u.created_at,
          (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id) AS post_count,
          (SELECT COUNT(*) FROM followers f WHERE f.follower_id = u.id) AS following_count,
          (SELECT COUNT(*) FROM followers f WHERE f.followed_id = u.id) AS followers_count
      FROM users u
      WHERE u.id = $1;
    `;
    const { rows } = await pool.query(profileQuery, [internalUserId]);

    const postsQuery = `
      SELECT p.id, p.title, p.slug, p.cover_media_id, p.created_at 
      FROM posts p
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC;
    `;
    const postsResult = await pool.query(postsQuery, [internalUserId]);

    const profileData = {
      ...rows[0],
      posts: postsResult.rows,
    };
    res.status(200).json(profileData);
  } catch (error) {
    console.error("Greška pri dohvatanju profila:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// --- API RUTA ZA SAČUVANE ČLANKE ---
app.get("/api/posts/saved", ClerkExpressWithAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });

  try {
    const query = `
      SELECT p.id, p.title, p.slug, p.created_at, u_author.username as author_username
      FROM saved_posts sp
      JOIN posts p ON sp.post_id = p.id
      JOIN users u_reader ON sp.user_id = u_reader.id
      JOIN users u_author ON p.author_id = u_author.id
      WHERE u_reader.clerk_id = $1
      ORDER BY sp.saved_at DESC;
    `;
    const { rows } = await pool.query(query, [clerkId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju sačuvanih postova:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// zaprati korisnika
app.post(
  "/api/users/:userId/follow",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const followerClerkId = req.auth.userId;
    const { userId: followedId } = req.params;

    try {
      const followerId = await getInternalUserId(followerClerkId);
      if (!followerId || followerId == followedId) {
        return res.status(400).json({ error: "Nevažeća operacija." });
      }
      await pool.query(
        "INSERT INTO followers (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [followerId, followedId]
      );
      res.status(201).json({ message: "Korisnik zapraćen." });
    } catch (error) {
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// OTPRATI KORISNIKA
app.delete(
  "/api/users/:userId/follow",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const followerClerkId = req.auth.userId;
    const { userId: followedId } = req.params;

    try {
      const followerId = await getInternalUserId(followerClerkId);
      if (!followerId)
        return res.status(400).json({ error: "Nevažeća operacija." });

      await pool.query(
        "DELETE FROM followers WHERE follower_id = $1 AND followed_id = $2",
        [followerId, followedId]
      );
      res.status(200).json({ message: "Korisnik otpraćen." });
    } catch (error) {
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// BLOKIRAJ KORISNIKA
app.post(
  "/api/users/:userId/block",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const blockerClerkId = req.auth.userId;
    const { userId: blockedId } = req.params;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const blockerId = await getInternalUserId(blockerClerkId);
      if (!blockerId || blockerId == blockedId) {
        return res.status(400).json({ error: "Nevažeća operacija." });
      }

      await client.query(
        "INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [blockerId, blockedId]
      );

      await client.query(
        "DELETE FROM followers WHERE (follower_id = $1 AND followed_id = $2) OR (follower_id = $2 AND followed_id = $1)",
        [blockerId, blockedId]
      );

      await client.query("COMMIT");
      res.status(201).json({ message: "Korisnik blokiran i otpraćen." });
    } catch (error) {
      console.error("Greška pri blokiranju korisnika:", error);
      await client.query("ROLLBACK");
      res.status(500).json({ error: "Greška na serveru." });
    } finally {
      client.release();
    }
  }
);

// ODBLOKIRAJ KORISNIKA
app.delete(
  "/api/users/:userId/block",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const blockerClerkId = req.auth.userId;
    const { userId: blockedId } = req.params;

    try {
      const blockerId = await getInternalUserId(blockerClerkId);
      if (!blockerId)
        return res.status(400).json({ error: "Nevažeća operacija." });

      await pool.query(
        "DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2",
        [blockerId, blockedId]
      );
      res.status(200).json({ message: "Korisnik odblokiran." });
    } catch (error) {
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// API RUTA ZA SAVE POSTA
app.post(
  "/api/posts/:postId/save",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;

    if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });

    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      // ON CONFLICT DO NOTHING osigurava da ne moze save isti post 2 put
      const saveQuery = `
            INSERT INTO saved_posts (user_id, post_id, saved_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id, post_id) DO NOTHING;
        `;
      await pool.query(saveQuery, [userId, postId]);

      res.status(201).json({ message: "Post je sačuvan." });
    } catch (error) {
      console.error("Greška pri čuvanju posta:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// RUTA ZA UKLANJANJE SAČUVANOG POSTA
app.delete(
  "/api/posts/:postId/save",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;

    if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });

    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      await pool.query(
        "DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      res.status(200).json({ message: "Post je uklonjen iz sačuvanih." });
    } catch (error) {
      console.error("Greška pri uklanjanju sačuvanog posta:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// --- API RUTA ZA ISTORIJU ČITANJA ---
app.get("/api/posts/history", ClerkExpressWithAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });

  try {
    const query = `
      SELECT p.id, p.title, p.slug, p.created_at, u_author.username as author_username
      FROM reading_history rh
      JOIN posts p ON rh.post_id = p.id
      JOIN users u_reader ON rh.user_id = u_reader.id
      JOIN users u_author ON p.author_id = u_author.id
      WHERE u_reader.clerk_id = $1
      ORDER BY rh.read_at DESC;
    `;
    const { rows } = await pool.query(query, [clerkId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju istorije čitanja:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

app.use(express.static(path.join(__dirname, "../dist")));

// Endpoint za webhook
app.post(
  "/api/webhooks/clerk",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error("Greška: CLERK_WEBHOOK_SECRET nije podešen na serveru.");
      return res.status(500).send("Webhook secret nije konfigurisan.");
    }

    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).send("Error occured -- no svix headers");
    }

    const body = req.body;
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(400).send("Error occured");
    }

    const { type, data } = evt;

    if (type === "user.created") {
      console.log(
        "Događaj 'user.created' primljen. Podaci:",
        JSON.stringify(data, null, 2)
      );

      const {
        id,
        email_addresses,
        first_name,
        last_name,
        username,
        image_url,
      } = data;
      const email = email_addresses[0]?.email_address;
      if (!email) {
        console.error("Korisnik nema email adresu.");
        return res
          .status(200)
          .json({ message: "Korisnik nema email, preskače se." });
      }

      try {
        const dbUsername =
          username || email.split("@")[0] + Math.floor(Math.random() * 1000);
        console.log(`Pokušavam da upišem korisnika: ${dbUsername}`);

        const query = `
        INSERT INTO users (clerk_id, username, email, first_name, last_name, role, profile_picture_url)
        VALUES ($1, $2, $3, $4, $5, 'standard', $6)
        ON CONFLICT (clerk_id) DO NOTHING
        RETURNING id;`;

        const values = [
          id,
          dbUsername,
          email,
          first_name,
          last_name,
          image_url,
        ];
        const result = await pool.query(query, values);

        if (result.rowCount > 0) {
          console.log(
            `Korisnik ${dbUsername} je upisan u bazu sa ID: ${result.rows[0].id}`
          );
        } else {
          console.log(
            `Korisnik sa clerk_id ${id} već postoji u bazi, preskače se.`
          );
        }
        res.status(201).send("Webhook uspešno obrađen.");
      } catch (dbErr) {
        console.error("Database error:", dbErr);
        res
          .status(500)
          .json({ error: "Internal server error.", details: dbErr.message });
      }
    } else {
      console.log(`Događaj '${type}' primljen, ali se ne obrađuje.`);
      res.status(200).send("Webhook primljen ali nije obrađen.");
    }
  }
);

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Backend server sluša na http://localhost:${port}`);
});
