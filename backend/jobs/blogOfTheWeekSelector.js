const selectPostOfTheWeek = async (pool) => {
  console.log(
    `[${new Date().toLocaleTimeString()}] Pokrećem odabir objave sedmice...`
  );
  const client = await pool.connect();
  try {
    const bestPostQuery = `
            SELECT p.id
            FROM posts p
            LEFT JOIN post_votes pv ON p.id = pv.post_id
            WHERE p.created_at >= NOW() - INTERVAL '7 days' AND p.status = 'published'
            GROUP BY p.id
            ORDER BY COALESCE(SUM(pv.vote_type), 0) DESC, p.view_count DESC
            LIMIT 1;
        `;
    const { rows } = await client.query(bestPostQuery);

    if (rows.length > 0) {
      const bestPostId = rows[0].id;
      console.log(`Nova objava sedmice je post sa ID: ${bestPostId}`);
      const upsertQuery = `
                INSERT INTO featured_post (id, post_id, updated_at)
                VALUES (1, $1, NOW())
                ON CONFLICT (id) DO UPDATE
                SET post_id = EXCLUDED.post_id, updated_at = NOW();
            `;
      await client.query(upsertQuery, [bestPostId]);
    } else {
      console.log("Nema novih objava u poslednjih 7 dana za odabir.");
    }
  } catch (error) {
    console.error("Greška pri odabiru objave sedmice:", error);
  } finally {
    client.release();
  }
};

const scheduleWeeklyJob = (pool) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const targetDay = 0;
  const targetHour = 23;
  const targetMinute = 59;
  let msUntilTrigger = 0;

  const executeAndReschedule = () => {
    selectPostOfTheWeek(pool);
    setInterval(() => selectPostOfTheWeek(pool), 7 * 24 * 60 * 60 * 1000);
  };

  const triggerDate = new Date();
  triggerDate.setHours(targetHour, targetMinute, 0, 0);
  const daysUntilTarget = (targetDay - dayOfWeek + 7) % 7;
  triggerDate.setDate(triggerDate.getDate() + daysUntilTarget);
  if (daysUntilTarget === 0 && now > triggerDate) {
    triggerDate.setDate(triggerDate.getDate() + 7);
  }
  msUntilTrigger = triggerDate.getTime() - now.getTime();

  console.log(
    `Sledeći odabir objave sedmice zakazan za: ${new Date(
      Date.now() + msUntilTrigger
    ).toLocaleString()}`
  );
  setTimeout(executeAndReschedule, msUntilTrigger);
};

module.exports = { scheduleWeeklyJob };
