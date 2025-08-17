const publishScheduledPosts = async (pool) => {
  console.log(
    `[${new Date().toLocaleTimeString()}] Provjera zakazanih objava...`
  );
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: postsToPublish } = await client.query(
      "SELECT id, author_id FROM posts WHERE status = 'scheduled' AND publish_at <= NOW()"
    );

    if (postsToPublish.length > 0) {
      const postIds = postsToPublish.map((p) => p.id);
      console.log(`Objavljujem ${postIds.length} postova:`, postIds);

      await client.query(
        "UPDATE posts SET status = 'published', publish_at = NULL WHERE id = ANY($1::int[])",
        [postIds]
      );

      for (const post of postsToPublish) {
        const followersRes = await client.query(
          `SELECT follower_id FROM followers WHERE followed_id = $1 AND notifications_enabled = TRUE`,
          [post.author_id]
        );
        if (followersRes.rowCount > 0) {
          const followerIds = followersRes.rows.map((r) => r.follower_id);
          if (followerIds.length > 0) {
            const notificationParams = followerIds.flatMap((id) => [
              id,
              "new_post_from_followed",
              post.id,
            ]);
            const valuePlaceholders = followerIds
              .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
              .join(",");
            const notificationQuery = `INSERT INTO notifications (recipient_id, type, related_entity_id) VALUES ${valuePlaceholders}`;
            await client.query(notificationQuery, notificationParams);
          }
        }
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    if (client.active) {
      await client.query("ROLLBACK");
    }
    console.error("Greška pri automatskom objavljivanju postova:", error);
  } finally {
    client.release();
  }
};

module.exports = { publishScheduledPosts };
