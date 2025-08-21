require("dotenv").config();
const express = require("express");
const { Webhook } = require("svix");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const { ClerkExpressWithAuth, clerkClient } = require("@clerk/clerk-sdk-node");
const path = require("path");
const session = require("express-session");
const ImageKit = require("imagekit");

const adminRoutes = require("./routes/admin");

const { translate } = require("@vitalets/google-translate-api");

const { publishScheduledPosts } = require("./jobs/postScheduler");
const { scheduleWeeklyJob } = require("./jobs/blogOfTheWeekSelector");

const postsRouter = require("./routes/posts");
const usersRouter = require("./routes/users");
const { getCensoredWords, containsCensoredWord } = require("./utils/censor");

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL nije definisan u .env fajlu");
}

const imagekit = new ImageKit({
  publicKey: process.env.VITE_IK_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.VITE_IK_URL_ENDPOINT,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  idleTimeoutMillis: 90000,
  connectionTimeoutMillis: 5000,
});

// dodana max velicina za server
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8,
      path: "/api/admin",
    },
  })
);
app.use("/api/admin", adminRoutes(pool));

const getInternalUserId = async (clerkId) => {
  if (!clerkId) return null;
  const result = await pool.query("SELECT id FROM users WHERE clerk_id = $1", [
    clerkId,
  ]);
  return result.rows.length > 0 ? result.rows[0].id : null;
};

app.use("/api/posts", postsRouter(pool, getInternalUserId));

const userRouterInstance = usersRouter(pool, getInternalUserId);

app.use("/api/profile", userRouterInstance); // Gađa rute kao /api/profile/drafts
app.use("/api/profiles", userRouterInstance); // Gađa rute kao /api/profiles/blognetworkljubitelj9000
app.use("/api/users", userRouterInstance);

//za neprijavljenog korisnika dohvatanje profila
app.get("/api/public/profiles/:username", async (req, res) => {
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
});

app.get("/api/public/posts/featured", async (req, res) => {
  try {
    const query = `
            SELECT 
                p.id, p.title, p.slug, p.content, p.created_at,
                u.username AS author_username,
                c.name AS category_name
            FROM posts p
            JOIN users u ON p.author_id = u.id
            JOIN categories c ON p.category_id = c.id
            JOIN featured_post fp ON p.id = fp.post_id
            WHERE fp.id = 1;
        `;
    const { rows } = await pool.query(query);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Objava sedmice nije postavljena." });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Greška pri dohvatanju objave sedmice:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// DOHVATANJE VISE OBJAVA
app.get("/api/public/posts", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 4;
  const offset = (page - 1) * limit;

  try {
    const postsQuery = `
      SELECT 
        p.id, p.title, p.slug, p.content, p.created_at,
        u.username AS author_username, p.view_count,
        c.name AS category_name,
        (SELECT COALESCE(SUM(vote_type), 0) FROM post_votes WHERE post_id = p.id) AS vote_score
      FROM posts p
      JOIN users u ON p.author_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await pool.query(postsQuery, [limit, offset]);
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM posts WHERE status = 'published'"
    );
    const total = parseInt(countResult.rows[0].count);
    const hasMore = offset + limit < total;

    res.json({ posts: rows, hasMore });
  } catch (error) {
    console.error("Greška pri dohvatanju postova:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

app.get("/api/public/search", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const offset = (page - 1) * limit;

  const {
    search,
    category,
    minLikes,
    maxLikes,
    minDate,
    maxDate,
    tags,
    sortBy,
    sortOrder,
    currentUserId,
  } = req.query;

  let params = [];
  const whereClauses = ["p.status = 'published'"];
  let paramIndex = 1;

  if (search) {
    whereClauses.push(
      `(p.title ILIKE '%' || $${paramIndex} || '%' OR p.content ILIKE '%' || $${paramIndex} || '%')`
    );
    params.push(search);
    paramIndex++;
  }

  if (category) {
    whereClauses.push(`p.category_id = $${paramIndex}`);
    params.push(parseInt(category));
    paramIndex++;
  }

  if (minDate) {
    whereClauses.push(`p.created_at >= $${paramIndex}`);
    params.push(minDate);
    paramIndex++;
  }

  if (maxDate) {
    whereClauses.push(`p.created_at <= $${paramIndex}`);
    params.push(maxDate);
    paramIndex++;
  }

  const tagsArray = Array.isArray(tags) ? tags : tags ? [tags] : [];
  if (tagsArray.length > 0) {
    whereClauses.push(`(
      SELECT COUNT(DISTINCT t.name)
      FROM post_tags pt
      JOIN tags t ON pt.tag_id = t.id
      WHERE pt.post_id = p.id AND t.name = ANY($${paramIndex}::text[])
    ) = ${tagsArray.length}`);
    params.push(tagsArray);
    paramIndex++;
  }

  if (minLikes || maxLikes) {
    if (minLikes) {
      whereClauses.push(
        `(SELECT COALESCE(SUM(vote_type), 0) FROM post_votes WHERE post_id = p.id) >= $${paramIndex}`
      );
      params.push(parseInt(minLikes));
      paramIndex++;
    }
    if (maxLikes) {
      whereClauses.push(
        `(SELECT COALESCE(SUM(vote_type), 0) FROM post_votes WHERE post_id = p.id) <= $${paramIndex}`
      );
      params.push(parseInt(maxLikes));
      paramIndex++;
    }
  }

  let numericUserId = null;

  if (currentUserId) {
    try {

      const userResult = await pool.query(
        "SELECT id FROM users WHERE clerk_id = $1",
        [currentUserId]
      );

      if (userResult.rows.length > 0) {
        numericUserId = userResult.rows[0].id;
      }
    } catch (dbError) {
      console.error(
        "Greška pri dohvatanju internog ID-ja korisnika:",
        dbError
      );
    }
  }

  if (numericUserId) {
    whereClauses.push(
      `p.author_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = $${paramIndex})`
    );
    params.push(numericUserId);
    paramIndex++;

    whereClauses.push(
      `p.author_id NOT IN (SELECT blocker_id FROM blocked_users WHERE blocked_id = $${paramIndex})`
    );
    params.push(numericUserId);
    paramIndex++;
  }

  const whereClause = `WHERE ${whereClauses.join(" AND ")}`;

  const allowedSortBy = {
    createdAt: "p.created_at",
    voteScore: "vote_score",
    viewCount: "p.view_count",
  };

  const sortColumn = allowedSortBy[sortBy] || "p.created_at";

  const order = sortOrder && sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  const orderByClause = `ORDER BY ${sortColumn} ${order}`;

  const postsQuery = `SELECT 
      p.id, p.title, p.slug, p.created_at, p.view_count,
      u.username AS author_username,
      u.profile_picture_url AS author_profile_picture_url,
      c.name AS category_name,
      (SELECT COALESCE(SUM(vote_type), 0) FROM post_votes WHERE post_id = p.id) AS vote_score,
      (SELECT COALESCE(STRING_AGG(t.name, ', '), '') FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id) AS tags
    FROM posts p
    JOIN users u ON p.author_id = u.id
    JOIN categories c ON p.category_id = c.id
    ${whereClause}
    ${orderByClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const finalParams = [...params, limit, offset];

  try {
    const { rows } = await pool.query(postsQuery, finalParams);
    
    const countParams = params;
    const countQuery = `SELECT COUNT(*) FROM posts p ${whereClause}`;
    const countResult = await pool.query(countQuery, countParams);

    const total = parseInt(countResult.rows[0].count);
    const hasMore = offset + limit < total;

    res.json({ posts: rows, hasMore });
  } catch (error) {
    console.error("Greška pri dohvatanju postova:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// DOHVATANJE OBJAVE IZ BAZE
app.get("/api/public/posts/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const postQuery = `
      SELECT p.id, p.title, p.slug, p.content, p.created_at, p.updated_at, p.is_pinned,
             u.username AS author_username, c.name AS category_name, c.id AS category_id, p.view_count,
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
      return res
        .status(404)
        .json({ error: "Post nije pronađen ili još uvek nije objavljen." });
    }
    res.json(postResult.rows[0]);
  } catch (error) {
    console.error("Greška pri dohvatanju javnog posta:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});
// OBJAVLJIVANJE KOMENTARA
app.post("/api/comments", ClerkExpressWithAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  const { postId, content, parentCommentId } = req.body;
  if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });
  if (!postId || !content)
    return res.status(400).json({ error: "ID posta i sadržaj su obavezni." });

  const badWords = await getCensoredWords(pool);
  if (containsCensoredWord(content, badWords)) {
    return res
      .status(400)
      .json({ error: "Vaš komentar sadrži nedozvoljene riječi." });
  }

  try {
    const userId = await getInternalUserId(clerkId);
    if (!userId)
      return res.status(404).json({ error: "Korisnik nije pronađen." });

    const query = `
       INSERT INTO comments (post_id, user_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4) RETURNING id, post_id, user_id, content, parent_comment_id, created_at
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
    res
      .status(201)
      .json({ message: "Komentar uspješno dodat.", comment: fullCommentData });

    if (parentCommentId) {
      try {
        const parentCommentRes = await pool.query(
          "SELECT user_id FROM comments WHERE id = $1",
          [parentCommentId]
        );
        if (parentCommentRes.rowCount > 0) {
          const parentAuthorId = parentCommentRes.rows[0].user_id;
          if (parentAuthorId !== userId) {
            await pool.query(
              `INSERT INTO notifications (recipient_id, type, related_entity_id, secondary_entity_id) VALUES ($1, 'reply_to_comment', $2, $3)`,
              [parentAuthorId, postId, parentCommentId]
            );
          }
        }
      } catch (notificationError) {
        console.error(
          "Greška pri slanju notifikacija za odgovor:",
          notificationError
        );
      }
    }
  } catch (err) {
    console.error("Greška pri dodavanju komentara:", err);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

app.get("/api/notifications", ClerkExpressWithAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  try {
    const userId = await getInternalUserId(clerkId);
    if (!userId)
      return res.status(404).json({ error: "Korisnik nije pronađen." });

    const { rows } = await pool.query(
      `
            SELECT 
                n.id, n.type, n.is_read, n.created_at,
                p.slug AS post_slug,
                p.title AS post_title,
                ri.description AS issue_description,
                
                CASE
                    WHEN n.type = 'new_post_from_followed' 
                        THEN (SELECT u.username FROM posts po JOIN users u ON po.author_id = u.id WHERE po.id = n.related_entity_id)
                    WHEN n.type = 'reply_to_comment' 
                        THEN (SELECT u.username FROM comments co JOIN users u ON co.user_id = u.id WHERE co.parent_comment_id = n.secondary_entity_id ORDER BY co.created_at DESC LIMIT 1)
                    WHEN n.type = 'issue_status_change' 
                        THEN 'Admin Tim'
                END AS actor_username
            FROM notifications n
            LEFT JOIN posts p ON n.related_entity_id = p.id AND n.type IN ('new_post_from_followed', 'reply_to_comment')
            LEFT JOIN reported_issues ri ON n.related_entity_id = ri.id AND n.type = 'issue_status_change'
            WHERE n.recipient_id = $1 
            ORDER BY n.created_at DESC 
            LIMIT 30;
        `,
      [userId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju notifikacija:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

app.put(
  "/api/notifications/:notificationId/read",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const clerkId = req.auth.userId;
    const { notificationId } = req.params;

    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      const result = await pool.query(
        "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2",
        [notificationId, userId]
      );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Notifikacija nije pronađena ili nemate pristup." });
      }

      res.status(200).json({ message: "Notifikacija označena kao pročitana." });
    } catch (error) {
      console.error(
        "Greška pri označavanju notifikacije kao pročitane:",
        error
      );
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

app.post(
  "/api/notifications/mark-as-read",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const clerkId = req.auth.userId;
    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId) {
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      }

      const result = await pool.query(
        "UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE",
        [userId]
      );

      res.status(200).json({
        message: "Sve notifikacije označene kao pročitane.",
        updatedCount: result.rowCount,
      });
    } catch (error) {
      console.error(
        "Greška pri označavanju notifikacija kao pročitanih:",
        error
      );
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// --- RUTA ZA PRIJAVU PROBLEMA ---
app.post(
  "/api/issues",
  ClerkExpressWithAuth({ optional: true }),
  async (req, res) => {
    const clerkId = req.auth.userId;
    const { issueType, description, relatedEntityType, relatedEntityId } =
      req.body;

    if (!issueType || !description) {
      return res
        .status(400)
        .json({ error: "Tip problema i opis su obavezni." });
    }
    const validIssueTypes = [
      "bug_report",
      "inappropriate_content",
      "spam",
      "other",
    ];
    if (!validIssueTypes.includes(issueType)) {
      return res.status(400).json({ error: "Nevažeći tip problema." });
    }

    try {
      const reporterUserId = await getInternalUserId(clerkId); // null ako user nije prijavljen

      const query = `
            INSERT INTO reported_issues 
                (reporter_user_id, issue_type, description, related_entity_type, related_entity_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `;
      const values = [
        reporterUserId,
        issueType,
        description,
        relatedEntityType || null,
        relatedEntityId || null,
      ];

      await pool.query(query, values);

      res.status(201).json({
        message: "Problem je uspješno prijavljen. Hvala vam na pomoći!",
      });
    } catch (error) {
      console.error("Greška pri prijavi problema:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

// DOHVATANJE SVIH KOMENTARA ZA OBJAVU ---
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

app.get("/api/tags", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name FROM tags ORDER BY name ASC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju tagova:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

app.delete(
  "/api/comments/:commentId",
  ClerkExpressWithAuth(),
  async (req, res) => {
    const clerkId = req.auth.userId;
    const { commentId } = req.params;

    try {
      const userResult = await pool.query(
        "SELECT id, role FROM users WHERE clerk_id = $1",
        [clerkId]
      );
      if (userResult.rowCount === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const deleter = userResult.rows[0];

      const commentResult = await pool.query(
        "SELECT post_id FROM comments WHERE id = $1",
        [commentId]
      );
      if (commentResult.rowCount === 0)
        return res.status(404).json({ error: "Komentar nije pronađen." });
      const postId = commentResult.rows[0].post_id;

      const postResult = await pool.query(
        "SELECT author_id FROM posts WHERE id = $1",
        [postId]
      );
      if (postResult.rowCount === 0)
        return res.status(404).json({ error: "Povezani post nije pronađen." });
      const postAuthorId = postResult.rows[0].author_id;

      const permissionResult = await pool.query(
        "SELECT EXISTS (SELECT 1 FROM moderator_permissions WHERE blogger_id = $1 AND moderator_id = $2)",
        [postAuthorId, deleter.id]
      );
      const isPersonalModerator = permissionResult.rows[0].exists;

      if (
        deleter.role !== "moderator" &&
        postAuthorId !== deleter.id &&
        !isPersonalModerator
      ) {
        return res
          .status(403)
          .json({ error: "Nemate dozvolu za brisanje ovog komentara." });
      }

      await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
      res.status(200).json({ message: "Komentar je uspješno obrisan." });
    } catch (error) {
      console.error("Greška pri brisanju komentara:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  }
);

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

app.post("/api/translate", express.json(), async (req, res) => {
  const { text, targetLang, isHtml } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: "Tekst i ciljni jezik su obavezni." });
  }

  try {
    const result = await translate(text, { to: targetLang, from: "auto" });

    res.status(200).json({ translatedText: result.text });
  } catch (error) {
    console.error("Greška pri prevođenju na backendu:", error);
    res
      .status(500)
      .json({ error: "Usluga za prevođenje trenutno nije dostupna." });
  }
});

app.get("/api/upload-auth", (req, res) => {
  const authenticationParameters = imagekit.getAuthenticationParameters();
  res.json(authenticationParameters);
});

// racunanje velicine koja je uploadana za blog
app.post("/api/media/details", ClerkExpressWithAuth(), async (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(200).json([]);
  }

  try {
    const detailPromises = urls.map(async (url) => {
      try {
        const fileName = url.substring(url.lastIndexOf("/") + 1);

        const list = await imagekit.listFiles({
          searchQuery: `name="${fileName}"`,
        });

        if (list && list.length === 1) {
          const file = list[0];
          return {
            url: file.url,
            size: file.size,
          };
        }
        return null;
      } catch (e) {
        console.error(`Greška pri dohvatanju detalja za ${url}:`, e);
        return null;
      }
    });

    const results = await Promise.all(detailPromises);

    const successfulDetails = results.filter((item) => item !== null);

    res.status(200).json(successfulDetails);
  } catch (error) {
    console.error("Glavna greška pri dohvatanju detalja sa ImageKit-a:", error);
    res.status(500).json({ error: "Greška pri provjeri veličine fajlova." });
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
        res.status(201).send("Webhook uspješno obrađen.");
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
  console.log("Pokrećem periodičnu provjeru zakazanih objava svakih 5min...");
  setInterval(() => {
    publishScheduledPosts(pool);
  }, 5 * 60 * 1000);
  scheduleWeeklyJob(pool);
});

app.get("/api/public/search/users", async (req, res) => {
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
});
