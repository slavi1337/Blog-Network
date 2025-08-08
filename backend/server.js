require("dotenv").config();
const express = require("express");
const { Webhook } = require("svix");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
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

app.post("/api/posts", ClerkExpressWithAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });

  const { title, categoryId, content } = req.body;

  if (!title || !content || !categoryId) {
    return res
      .status(400)
      .json({ error: "Naslov, sadržaj i kategorija su obavezni." });
  }

  try {
    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_id = $1",
      [clerkId]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Korisnik nije pronađen u bazi." });
    }
    const authorId = userResult.rows[0].id;

    const slugBase = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const slug = `${slugBase}-${Date.now()}`;
    const query = `
            INSERT INTO posts (author_id, category_id, title, slug, content, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'published', NOW(), NOW())
            RETURNING id, slug; -- Vrati ID i slug novog posta
        `;
    const values = [authorId, categoryId, title, slug, content];

    const newPost = await pool.query(query, values);

    res.status(201).json({
      message: "Post uspešno kreiran!",
      post: newPost.rows[0],
    });
  } catch (error) {
    console.error("Greška pri kreiranju posta:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

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

app.get("/api/profile/me", ClerkExpressWithAuth(), async (req, res) => {
  if (!req.auth.userId) {
    return res.status(401).json({ error: "Niste autorizovani." });
  }

  const clerkId = req.auth.userId;

  try {
    const profileQuery = `
            SELECT
                u.id,
                u.username,
                u.first_name,
                u.last_name,
                u.profile_picture_url,
                u.created_at,
                -- Broj objava korisnika
                (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id) AS post_count,
                -- Broj ljudi koje korisnik prati (following)
                (SELECT COUNT(*) FROM followers f WHERE f.follower_id = u.id) AS following_count,
                -- Broj ljudi koji prate korisnika (followers)
                (SELECT COUNT(*) FROM followers f WHERE f.followed_id = u.id) AS followers_count
            FROM
                users u
            WHERE
                u.clerk_id = $1;
        `;

    const { rows } = await pool.query(profileQuery, [clerkId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Korisnik nije pronađen u našoj bazi." });
    }

    const postsQuery = `
            SELECT p.id, p.title, p.slug, p.cover_media_id, p.created_at 
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE u.clerk_id = $1
            ORDER BY p.created_at DESC;
        `;

    const postsResult = await pool.query(postsQuery, [clerkId]);

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
        const dbUsername = username || email.split("@")[0];

        console.log(`Pokušavam da upišem korisnika: ${dbUsername}`);

        const query = `
        INSERT INTO users (clerk_id, username, email, first_name, last_name, role, profile_picture_url)
        VALUES ($1, $2, $3, $4, $5, 'standard', $6)
        ON CONFLICT (email) DO NOTHING
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
            `Korisnik sa emailom ${email} već postoji u bazi, preskače se.`
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
