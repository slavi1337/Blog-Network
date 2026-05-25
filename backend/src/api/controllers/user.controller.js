const { pool } = require("../../config/db");
const { getInternalUserId } = require("../../services/userService");


exports.getCurrentUserProfile = async (req, res) => {
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
      SELECT p.id, p.title, p.slug, p.cover_media_id, p.created_at, p.is_pinned
      FROM posts p
      WHERE p.author_id = $1
      ORDER BY p.is_pinned DESC, p.created_at DESC;
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
};


exports.getDrafts = async (req, res) => {
  const clerkId = req.auth.userId;
  try {
    const userId = await getInternalUserId(clerkId);
    if (!userId)
      return res.status(404).json({ error: "Korisnik nije pronađen." });

    const { rows } = await pool.query(
      `SELECT id, title, slug, status, updated_at, publish_at 
             FROM posts 
             WHERE author_id = $1 AND status IN ('draft', 'scheduled') 
             ORDER BY updated_at DESC`,
      [userId]
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Greška na serveru." });
  }
};


exports.getInterests = async (req, res) => {
  const clerkId = req.auth.userId;
  try {
    const userId = await getInternalUserId(clerkId);
    if (!userId) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    const { rows } = await pool.query(
      `SELECT tag_id FROM user_interested_tags WHERE user_id = $1`,
      [userId]
    );
    res.status(200).json(rows.map((row) => row.tag_id));
  } catch (error) {
    console.error("Greška pri dohvatanju interesovanja:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};


exports.updateInterests = async (req, res) => {
  const clerkId = req.auth.userId;
  const { tagIds } = req.body; // Očekujemo niz brojeva, npr. [1, 5, 12]

  if (!Array.isArray(tagIds)) {
    return res.status(400).json({ error: "Očekivan je niz ID-jeva tagova." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userId = await getInternalUserId(clerkId);
    if (!userId) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    await client.query("DELETE FROM user_interested_tags WHERE user_id = $1", [
      userId,
    ]);

    if (tagIds.length > 0) {
      const values = tagIds
        .map((tagId, index) => `($1, $${index + 2})`)
        .join(",");
      const query = `INSERT INTO user_interested_tags (user_id, tag_id) VALUES ${values}`;

      await client.query(query, [userId, ...tagIds]);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Interesovanja su uspješno ažurirana." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Greška pri ažuriranju interesovanja:", error);
    res.status(500).json({ error: "Greška na serveru." });
  } finally {
    client.release();
  }
};

exports.getModerators = async (req, res) => {
  const bloggerClerkId = req.auth.userId;
  try {
    const bloggerId = await getInternalUserId(bloggerClerkId);
    if (!bloggerId)
      return res.status(404).json({ error: "Bloger nije pronađen." });

    const { rows } = await pool.query(
      `
            SELECT u.id, u.username, u.profile_picture_url
            FROM users u
            JOIN moderator_permissions mp ON u.id = mp.moderator_id
            WHERE mp.blogger_id = $1
            ORDER BY u.username;
        `,
      [bloggerId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju moderatora:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

exports.addModerator = async (req, res) => {
  const bloggerClerkId = req.auth.userId;
  const { username: moderatorUsername } = req.body;

  if (!moderatorUsername) {
    return res
      .status(400)
      .json({ error: "Korisničko ime moderatora je obavezno." });
  }

  try {
    const bloggerId = await getInternalUserId(bloggerClerkId);
    if (!bloggerId)
      return res.status(404).json({ error: "Bloger nije pronađen." });

    const moderatorResult = await pool.query(
      "SELECT id, username FROM users WHERE username = $1",
      [moderatorUsername]
    );

    if (moderatorResult.rowCount === 0) {
      return res.status(404).json({
        error: `Korisnik sa imenom "${moderatorUsername}" nije pronađen.`,
      });
    }

    const moderator = moderatorResult.rows[0];

    if (moderator.id === bloggerId) {
      return res
        .status(400)
        .json({ error: "Ne možete dodati sebe kao moderatora." });
    }

    await pool.query(
      "INSERT INTO moderator_permissions (blogger_id, moderator_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [bloggerId, moderator.id]
    );

    const newModeratorData = await pool.query(
      "SELECT id, username, profile_picture_url FROM users WHERE id = $1",
      [moderator.id]
    );

    res.status(201).json(newModeratorData.rows[0]);
  } catch (error) {
    console.error("Greška pri dodavanju moderatora:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

exports.removeModerator = async (req, res) => {
  const bloggerClerkId = req.auth.userId;
  const { moderatorId } = req.params;

  try {
    const bloggerId = await getInternalUserId(bloggerClerkId);
    if (!bloggerId)
      return res.status(404).json({ error: "Bloger nije pronađen." });

    const result = await pool.query(
      "DELETE FROM moderator_permissions WHERE blogger_id = $1 AND moderator_id = $2",
      [bloggerId, moderatorId]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Dozvola nije pronađena ili nemate pristup." });
    }

    res.status(200).json({ message: "Moderator uspješno uklonjen." });
  } catch (error) {
    console.error("Greška pri uklanjanju moderatora:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

exports.getFollowing = async (req, res) => {
  const clerkId = req.auth.userId;
  try {
    const userId = await getInternalUserId(clerkId);
    if (!userId)
      return res.status(404).json({ error: "Korisnik nije pronađen." });

    const { rows } = await pool.query(
      `
            SELECT u.id, u.username, u.first_name, u.last_name, u.profile_picture_url
            FROM users u
            JOIN followers f ON u.id = f.followed_id
            WHERE f.follower_id = $1
            ORDER BY u.username;
        `,
      [userId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju liste praćenih:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

exports.getFollowers = async (req, res) => {
  const clerkId = req.auth.userId;
  try {
    const userId = await getInternalUserId(clerkId);
    if (!userId)
      return res.status(404).json({ error: "Korisnik nije pronađen." });

    const { rows } = await pool.query(
      `
            SELECT u.id, u.username, u.first_name, u.last_name, u.profile_picture_url
            FROM users u
            JOIN followers f ON u.id = f.follower_id
            WHERE f.followed_id = $1
            ORDER BY u.username;
        `,
      [userId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju liste pratilaca:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

exports.updateFollowNotifications = async (req, res) => {
  const followerClerkId = req.auth.userId;
  const { userId: followedId } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    return res
      .status(400)
      .json({ error: 'Polje "enabled" mora biti boolean.' });
  }

  try {
    const followerId = await getInternalUserId(followerClerkId);
    if (!followerId)
      return res.status(404).json({ error: "Korisnik nije pronađen." });

    const result = await pool.query(
      "UPDATE followers SET notifications_enabled = $1 WHERE follower_id = $2 AND followed_id = $3",
      [enabled, followerId, followedId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Veza praćenja nije pronađena." });
    }

    res.status(200).json({ message: "Podešavanja notifikacija ažurirana." });
  } catch (error) {
    console.error("Greška pri ažuriranju notifikacija:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

exports.followUser = async (req, res) => {
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
};

exports.unfollowUser = async (req, res) => {
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
};

exports.blockUser = async (req, res) => {
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
};

exports.unblockUser = async (req, res) => {
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
};


exports.getProfileStatus = async (req, res) => {
  const { username } = req.params;
  const viewerClerkId = req.auth.userId;

  try {
    const viewerId = await getInternalUserId(viewerClerkId);
    if (!viewerId)
      return res.status(404).json({ error: "Gledalac nije pronađen." });

    const profileOwnerResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (profileOwnerResult.rowCount === 0)
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    const profileOwnerId = profileOwnerResult.rows[0].id;

    const statusQuery = `
            SELECT
                EXISTS(SELECT 1 FROM followers WHERE follower_id = $1 AND followed_id = $2) as is_followed_by_viewer,
                (SELECT f.notifications_enabled FROM followers f WHERE follower_id = $1 AND followed_id = $2) as notifications_enabled_for_viewer,
                EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2) as viewer_has_blocked,
                EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $2 AND blocked_id = $1) as has_been_blocked_by_profile_owner
        `;
    const statusResult = await pool.query(statusQuery, [
      viewerId,
      profileOwnerId,
    ]);

    res.status(200).json(statusResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Greška na serveru." });
  }
};

  
exports.getUserStats = async (req, res) => {
  const clerkId = req.auth.userId;
  console.log("Pokušaj dohvatanja stats za Clerk ID:", clerkId);

  try {
   
    const userId = await getInternalUserId(clerkId);
    console.log("Interni ID u bazi:", userId);
    
    if (!userId) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }


  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM posts WHERE author_id = $1) as posts_count,
      (SELECT COALESCE(SUM(view_count), 0) FROM posts WHERE author_id = $1) as total_views,
      (SELECT COUNT(*) FROM post_votes pv JOIN posts p ON pv.post_id = p.id WHERE p.author_id = $1) as likes_count,
      (SELECT COUNT(*) FROM followers WHERE followed_id = $1) as followers_count,
      (SELECT COUNT(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.author_id = $1) as comments_count
  `;
    
    const chartQuery = `
      SELECT TO_CHAR(created_at, 'DD.MM') as label, COUNT(*) as value
      FROM posts
      WHERE author_id = $1
      GROUP BY label, created_at
      ORDER BY created_at ASC
    `;

  const categoryQuery = `
    SELECT c.name as label, SUM(p.view_count) as value
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    WHERE p.author_id = $1
    GROUP BY c.name
  `;

  const stats = await pool.query(statsQuery, [userId]);
  const chart = await pool.query(chartQuery, [userId]);
  const categories = await pool.query(categoryQuery, [userId]);

  res.status(200).json({
    cards: {
      posts_count: stats.rows[0].posts_count || 0,
      total_views: stats.rows[0].total_views || 0,
      comments_count: stats.rows[0].comments_count || 0,
      likes_count: stats.rows[0].likes_count || 0,
      followers_count: stats.rows[0].followers_count || 0
    },
    chartData: chart.rows,
    categoryData: categories.rows
  });
  } catch (error) {
    console.error("Greška pri dohvatanju analitike:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }

};
