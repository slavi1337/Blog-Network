const { pool } = require("../../config/db");
const { clerkClient } = require("../../config/clerk");
const { getInternalUserId } = require("../../services/userService");
const {
  getCensoredWords,
  containsCensoredWord,
} = require("../../utils/censor");

// OBJAVLJIVANJE/POSTAVLJANJE KOMENTARA
exports.createComment = async (req, res) => {
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
};

// BRISANJE KOMENTARA
exports.deleteComment = async (req, res) => {
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
      "SELECT user_id, post_id FROM comments WHERE id = $1",
      [commentId]
    );
    if (commentResult.rowCount === 0)
      return res.status(404).json({ error: "Komentar nije pronađen." });
    const commentAuthorId = commentResult.rows[0].user_id;
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
    const isGlobalMod = deleter.role === "moderator";
    const isPostAuthor = postAuthorId === deleter.id;
    const isCommentAuthor = commentAuthorId === deleter.id;

    if (isGlobalMod || isPostAuthor || isPersonalModerator || isCommentAuthor) {
      await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
      return res.status(200).json({ message: "Komentar je uspješno obrisan." });
    } else {
      return res
        .status(403)
        .json({ error: "Nemate dozvolu za brisanje ovog komentara." });
    }
  } catch (error) {
    console.error("Greška pri brisanju komentara:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

// DOHVATANJE SVIH KOMENTARA ZA OBJAVU
exports.getCommentsForPost = async (req, res) => {
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
};
