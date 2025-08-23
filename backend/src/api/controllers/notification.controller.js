const { pool } = require("../../config/db");
const { getInternalUserId } = require("../../services/userService");

// DOHVATANJE NOTIFIKACIJA ZA KORISNIKA
exports.getAllNotifications = async (req, res) => {
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
                n.related_entity_id,
                
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
};

// OZNACAVANJE JEDNE NOTIFIKACIJE KAO PROCITANE
exports.markAsRead = async (req, res) => {
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
    console.error("Greška pri označavanju notifikacije kao pročitane:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

// OZNACAVANJE SVIH NOTIFIKACIJA KAO PROCITANIH
exports.markAllAsRead = async (req, res) => {
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
    console.error("Greška pri označavanju notifikacija kao pročitanih:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};
