const express = require("express");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");
const { getCensoredWords, containsCensoredWord } = require("../utils/censor");

const postsRouter = (pool, getInternalUserId) => {
  const router = express.Router();

  // KREIRANJE POSTA -> POST /api/posts/
  router.post("/", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { title, categoryId, content, tags, status, publishAt } = req.body;

    const MAX_POSTS_PER_DAY = 5;

    if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });
    if (!title || !content || !categoryId) {
      return res
        .status(400)
        .json({ error: "Naslov, sadržaj i kategorija su obavezni." });
    }

    const badWords = await getCensoredWords(pool);
    const MAX_IMAGES = 3;
    const MAX_VIDEOS = 3;
    const imageCount = (content.match(/<img/g) || []).length;
    const videoCount = (content.match(/<iframe/g) || []).length;

    if (imageCount > MAX_IMAGES) {
      return res
        .status(400)
        .json({ error: `Dozvoljeno je najviše ${MAX_IMAGES} slika.` });
    }
    if (videoCount > MAX_VIDEOS) {
      return res
        .status(400)
        .json({ error: `Dozvoljeno je najviše ${MAX_VIDEOS} videa.` });
    }
    if (
      containsCensoredWord(title, badWords) ||
      containsCensoredWord(content, badWords) ||
      containsCensoredWord(tags, badWords)
    ) {
      return res
        .status(400)
        .json({ error: "Vaša objava sadrži nedozvoljene riječi." });
    }

    const finalStatus =
      status === "draft" || status === "scheduled" ? status : "published";
    const finalPublishAt =
      finalStatus === "scheduled" && publishAt ? publishAt : null;

    const client = await pool.connect();
    let authorId;

    try {
      await client.query("BEGIN");

      authorId = await getInternalUserId(clerkId);
      if (!authorId) throw new Error("Korisnik nije pronađen u bazi.");

      const postCountResult = await client.query(
        `SELECT COUNT(*) FROM posts WHERE author_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
        [authorId]
      );
      const postCountToday = parseInt(postCountResult.rows[0].count, 10);

      if (postCountToday >= MAX_POSTS_PER_DAY) {
        return res.status(429).json({
          error: `Dostigli ste dnevni(24h) limit od ${MAX_POSTS_PER_DAY} objava. Pokušajte ponovo sutra.`,
        });
      }

      const slugBase = title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const slug = `${slugBase}-${Date.now()}`;

      const query = `
        INSERT INTO posts (author_id, category_id, title, slug, content, status, publish_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, slug, status;
      `;
      const values = [
        authorId,
        categoryId,
        title,
        slug,
        content,
        finalStatus,
        finalPublishAt,
      ];
      const newPostResult = await client.query(query, values);
      const newPost = newPostResult.rows[0];

      const listaTagova = (tags || "")
        .split(/\s+/)
        .map((t) => t.replace(/^#/, ""))
        .filter((t) => t.length > 0);
      for (const tagName of listaTagova) {
        let { rows } = await client.query(
          "SELECT id FROM tags WHERE name = $1",
          [tagName]
        );
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
          [newPost.id, tagId]
        );
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: `Blog uspješno sačuvan kao ${finalStatus}!`,
        post: newPost,
      });

      if (finalStatus === "published") {
        console.log(
          `Post ${newPost.id} je objavljen. Tražim pratioce za autora ${authorId}...`
        );
        try {
          const followersRes = await pool.query(
            `SELECT follower_id FROM followers WHERE followed_id = $1 AND notifications_enabled = TRUE`,
            [authorId]
          );

          console.log(
            `Pronađeno ${followersRes.rowCount} pratilaca sa uključenim notifikacijama.`
          );

          if (followersRes.rowCount > 0) {
            const followerIds = followersRes.rows.map((r) => r.follower_id);
            console.log("Šaljem notifikacije korisnicima:", followerIds);

            const notificationParams = followerIds.flatMap((id) => [
              id,
              "new_post_from_followed",
              newPost.id,
            ]);
            const valuePlaceholders = followerIds
              .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
              .join(",");
            const notificationQuery = `INSERT INTO notifications (recipient_id, type, related_entity_id) VALUES ${valuePlaceholders}`;

            await pool.query(notificationQuery, notificationParams);
            console.log("Notifikacije uspješno upisane u bazu.");
          }
        } catch (notificationError) {
          console.error(
            "!!! GREŠKA pri slanju notifikacija za novi post:",
            notificationError
          );
        }
      }
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(
        "Greška pri kreiranju posta (transakcija poništena):",
        error
      );
      res.status(500).json({ error: "Greška na serveru." });
    } finally {
      client.release();
    }
  });

  // AŽURIRANJE POSTA -> PUT /api/posts/:postId
  router.put("/:postId", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;
    const { title, categoryId, content, tags, status, publishAt } = req.body;

    if (!title || !content || !categoryId) {
      return res
        .status(400)
        .json({ error: "Naslov, sadržaj i kategorija su obavezni." });
    }

    const badWords = await getCensoredWords(pool);
    const MAX_IMAGES = 3;
    const MAX_VIDEOS = 3;
    const imageCount = (content.match(/<img/g) || []).length;
    const videoCount = (content.match(/<iframe/g) || []).length;

    if (imageCount > MAX_IMAGES) {
      return res
        .status(400)
        .json({ error: `Dozvoljeno je najviše ${MAX_IMAGES} slika.` });
    }
    if (videoCount > MAX_VIDEOS) {
      return res
        .status(400)
        .json({ error: `Dozvoljeno je najviše ${MAX_VIDEOS} videa.` });
    }
    if (
      containsCensoredWord(title, badWords) ||
      containsCensoredWord(content, badWords) ||
      containsCensoredWord(tags, badWords)
    ) {
      return res
        .status(400)
        .json({ error: "Vaša objava sadrži nedozvoljene riječi." });
    }

    const finalStatus =
      status === "draft" || status === "scheduled" ? status : "published";
    const finalPublishAt =
      finalStatus === "scheduled" && publishAt ? publishAt : null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const internalUserId = await getInternalUserId(clerkId);
      if (!internalUserId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      const postResult = await client.query(
        "SELECT author_id FROM posts WHERE id = $1",
        [postId]
      );
      if (postResult.rowCount === 0)
        return res.status(404).json({ error: "Post nije pronađen." });
      if (postResult.rows[0].author_id !== internalUserId)
        return res
          .status(403)
          .json({ error: "Nemate dozvolu da mijenjate ovaj post." });

      await client.query(
        `UPDATE posts SET title = $1, category_id = $2, content = $3, status = $4, publish_at = $5, updated_at = NOW() WHERE id = $6`,
        [title, categoryId, content, finalStatus, finalPublishAt, postId]
      );

      await client.query("DELETE FROM post_tags WHERE post_id = $1", [postId]);

      const listaTagova = (tags || "")
        .split(/\s+/)
        .map((t) => t.replace(/^#/, ""))
        .filter((t) => t.length > 0);
      for (const tagName of listaTagova) {
        let { rows } = await client.query(
          "SELECT id FROM tags WHERE name = $1",
          [tagName]
        );
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
      res.status(200).json({ message: "Post je uspješno ažuriran." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Greška pri ažuriranju posta:", error);
      res.status(500).json({ error: "Greška na serveru." });
    } finally {
      client.release();
    }
  });

  // BRISANJE POSTA -> DELETE /api/posts/:postId
  router.delete("/:postId", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;

    try {
      const userResult = await pool.query(
        "SELECT id, role FROM users WHERE clerk_id = $1",
        [clerkId]
      );
      if (userResult.rowCount === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const deleter = userResult.rows[0];

      const postResult = await pool.query(
        "SELECT author_id FROM posts WHERE id = $1",
        [postId]
      );
      if (postResult.rowCount === 0)
        return res.status(404).json({ error: "Post nije pronađen." });
      const post = postResult.rows[0];

      if (deleter.role !== "moderator" && post.author_id !== deleter.id) {
        return res
          .status(403)
          .json({ error: "Nemate dozvolu za brisanje ovog posta." });
      }

      await pool.query("DELETE FROM posts WHERE id = $1", [postId]);

      res.status(200).json({ message: "Objava je uspješno obrisana." });
    } catch (error) {
      console.error("Greška pri brisanju objave:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  // BRISANJE DRAFT-a -> DELETE /api/posts/:postId/draft
  router.delete("/:postId/draft", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;

    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      const result = await pool.query(
        "DELETE FROM posts WHERE id = $1 AND author_id = $2 AND status IN ('draft', 'scheduled')",
        [postId, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: "Draft nije pronađen ili nemate dozvolu za brisanje.",
        });
      }

      res.status(200).json({ message: "uspješno obrisano." });
    } catch (error) {
      console.error("Greška pri brisanju drafta:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  // DOHVATANJE POSTA ZA EDITOVANJE -> GET /api/posts/:slug/edit
  router.get("/:slug/edit", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { slug } = req.params;

    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId) {
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      }

      const query = `
            SELECT 
                p.id, p.title, p.slug, p.content, p.status, p.publish_at,
                c.id AS category_id,
                STRING_AGG(t.name, ' ') AS tags
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN post_tags pt ON p.id = pt.post_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE p.slug = $1 AND p.author_id = $2
            GROUP BY p.id, c.id;
        `;
      const { rows } = await pool.query(query, [slug, userId]);

      if (rows.length === 0) {
        return res.status(404).json({
          error: "Post nije pronađen ili nemate dozvolu za uređivanje.",
        });
      }

      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Greška pri dohvatanju posta za uređivanje:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  // GLASANJE -> POST /api/posts/:postId/vote
  router.post("/:postId/vote", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;
    const { voteType } = req.body; // 1 za like i -1 za dislike

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
  });

  // UKLANJANJE GLASA -> DELETE /api/posts/:postId/vote
  router.delete("/:postId/vote", ClerkExpressWithAuth(), async (req, res) => {
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
  });

  // ČUVANJE POSTA -> POST /api/posts/:postId/save
  router.post("/:postId/save", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;

    if (!clerkId) return res.status(401).json({ error: "Niste autorizovani." });

    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      // ON CONFLICT DO NOTHING osigurava da ne možemo sačuvati isti post dvaput
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
  });

  // UKLANJANJE SAČUVANOG -> DELETE /api/posts/:postId/save
  router.delete("/:postId/save", ClerkExpressWithAuth(), async (req, res) => {
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
  });

  // DODAVANJE U ISTORIJU -> POST /api/posts/:postId/history
  router.post("/:postId/history", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;

    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });

      // ON CONFLICT updejtuje vrijeme citanja
      const query = `
            INSERT INTO reading_history (user_id, post_id, read_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id, post_id) DO UPDATE
            SET read_at = NOW();
        `;
      await pool.query(query, [userId, postId]);

      const updateViewCountQuery = `
            UPDATE posts 
            SET view_count = view_count + 1 
            WHERE id = $1;
        `;
      await pool.query(updateViewCountQuery, [postId]);

      res.status(201).json({ message: "Istorija čitanja ažurirana." });
    } catch (error) {
      console.error("Greška pri beleženju istorije čitanja:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  // BRISANJE IZ ISTORIJE -> DELETE /api/posts/:postId/history
  router.delete(
    "/:postId/history",
    ClerkExpressWithAuth(),
    async (req, res) => {
      const clerkId = req.auth.userId;
      const { postId } = req.params;

      try {
        const userId = await getInternalUserId(clerkId);
        if (!userId)
          return res.status(404).json({ error: "Korisnik nije pronađen." });

        const result = await pool.query(
          "DELETE FROM reading_history WHERE user_id = $1 AND post_id = $2",
          [userId, postId]
        );

        if (result.rowCount === 0) {
          return res
            .status(404)
            .json({ error: "Unos nije pronađen u istoriji." });
        }

        res.status(200).json({ message: "Uklonjeno iz istorije čitanja." });
      } catch (error) {
        console.error("Greška pri brisanju iz istorije čitanja:", error);
        res.status(500).json({ error: "Greška na serveru." });
      }
    }
  );

  // DOHVAANJE STATUSA -> GET /api/posts/:postId/status
  router.get("/:postId/status", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;

    try {
      const viewerResult = await pool.query(
        "SELECT id, role FROM users WHERE clerk_id = $1",
        [clerkId]
      );
      if (viewerResult.rowCount === 0)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const viewer = viewerResult.rows[0];

      const postAuthorResult = await pool.query(
        "SELECT author_id FROM posts WHERE id = $1",
        [postId]
      );
      const postAuthorId = postAuthorResult.rows[0]?.author_id;

      let isPersonalModerator = false;
      if (postAuthorId) {
        const permissionResult = await pool.query(
          "SELECT EXISTS (SELECT 1 FROM moderator_permissions WHERE blogger_id = $1 AND moderator_id = $2)",
          [postAuthorId, viewer.id]
        );
        isPersonalModerator = permissionResult.rows[0].exists;
      }

      const statusQuery = `
            SELECT 
                (SELECT vote_type FROM post_votes WHERE post_id = $1 AND user_id = $2) AS user_vote,
                (SELECT EXISTS (SELECT 1 FROM saved_posts WHERE post_id = $1 AND user_id = $2)) AS is_saved
        `;
      const statusResult = await pool.query(statusQuery, [postId, viewer.id]);

      res.json({
        ...statusResult.rows[0],
        viewer_role: viewer.role,
        viewer_is_personal_moderator: isPersonalModerator,
      });
    } catch (error) {
      console.error("Greška pri dohvatanju statusa posta:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  // PINOVANJE OBJAVE -> PUT /api/posts/:postId/pin
  router.put("/:postId/pin", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const userId = await getInternalUserId(clerkId);
      if (!userId) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      }
      const postRes = await client.query(
        "SELECT author_id FROM posts WHERE id = $1",
        [postId]
      );
      if (postRes.rowCount === 0 || postRes.rows[0].author_id !== userId) {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({ error: "Nemate dozvolu za pinovanje ovog posta." });
      }
      await client.query(
        "UPDATE posts SET is_pinned = FALSE WHERE author_id = $1",
        [userId]
      );
      await client.query(
        "UPDATE posts SET is_pinned = TRUE WHERE id = $1 AND author_id = $2",
        [postId, userId]
      );
      await client.query("COMMIT");
      res.status(200).json({ message: "Objava je uspješno pinovana." });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: "Greška na serveru." });
    } finally {
      client.release();
    }
  });

  // ODPINOVANJE OBJAVE -> PUT /api/posts/:postId/unpin
  router.put("/:postId/unpin", ClerkExpressWithAuth(), async (req, res) => {
    const clerkId = req.auth.userId;
    const { postId } = req.params;
    try {
      const userId = await getInternalUserId(clerkId);
      if (!userId)
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      const result = await pool.query(
        "UPDATE posts SET is_pinned = FALSE WHERE id = $1 AND author_id = $2",
        [postId, userId]
      );
      if (result.rowCount === 0)
        return res.status(403).json({ error: "Nemate dozvolu za ovu akciju." });
      res.status(200).json({ message: "Objava je uspješno odpinovana." });
    } catch (error) {
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  router.get("/foryou", ClerkExpressWithAuth(), async (req, res) => {
    if (!req.auth.userId) {
      return res.status(401).json({ error: "Niste autorizovani." });
    }

    const clerkId = req.auth.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const offset = (page - 1) * limit;

    try {
      const internalUserId = await getInternalUserId(clerkId);
      if (!internalUserId) {
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      }

      const commonWhereClause = `
            WHERE
                p.status = 'published'
                AND (
                    -- USLOV 1: Dohvati objave autora koje korisnik prati
                    p.author_id IN (
                        SELECT followed_id FROM followers WHERE follower_id = $1
                    )
                    OR
                    -- USLOV 2: Dohvati objave koje imaju tag koji interesuje korisnika
                    EXISTS (
                        SELECT 1
                        FROM post_tags pt
                        JOIN user_interested_tags uit ON pt.tag_id = uit.tag_id
                        WHERE pt.post_id = p.id AND uit.user_id = $1
                    )
                )
        `;

      const postsQuery = `
            SELECT
                p.id, p.title, p.slug, p.created_at, p.view_count, p.is_pinned,
                u.username AS author_username,
                u.profile_picture_url AS author_profile_picture_url,
                c.name AS category_name,
                (SELECT COALESCE(SUM(vote_type), 0) FROM post_votes WHERE post_id = p.id) AS vote_score,
                (SELECT STRING_AGG(t.name, ', ') FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id) AS tags
            FROM posts p
            JOIN users u ON p.author_id = u.id
            JOIN categories c ON p.category_id = c.id
            ${commonWhereClause}
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
        `;

      const { rows } = await pool.query(postsQuery, [
        internalUserId,
        limit,
        offset,
      ]);

      const countQuery = `
            SELECT COUNT(*) FROM posts p ${commonWhereClause}
        `;

      const countResult = await pool.query(countQuery, [internalUserId]);
      const total = parseInt(countResult.rows[0].count);

      const hasMore = offset + limit < total;
      res.json({ posts: rows, hasMore });
    } catch (error) {
      console.error("Greška pri dohvatanju 'For You' objava:", error);
      res.status(500).json({ error: "Greška na serveru." });
    }
  });

  return router;
};

module.exports = postsRouter;
