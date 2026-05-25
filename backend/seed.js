const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');


const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'blog_network', // provjeri da li se tvoja baza baš ovako zove
  password: 'admin123', // unesi svoju lozinku za bazu
  port: 5432,
});

async function popuniBazu() {
  // Ovdje stavi ID korisnika koji će biti "vlasnik" ovih testnih postova.
  // Pošto si ti vjerovatno prvi korisnik, to je ID: 1
  const mojUserId = 1; 

  console.log("🚀 Generisanje podataka je počelo...");

  try {
    for (let i = 0; i < 40; i++) {
      const naslov = faker.lorem.sentence({ min: 3, max: 6 });
      const slug = faker.helpers.slugify(naslov).toLowerCase() + "-" + faker.string.nanoid(4);
      const sadrzaj = faker.lorem.paragraphs(3);
      const pregledi = faker.number.int({ min: 20, max: 1500 });
      // Generišemo datume u zadnjih 30 dana da grafikon bude zanimljiv
      const datum = faker.date.recent({ days: 30 });

      // Ubacivanje posta u tvoju tabelu 'posts'
      const res = await pool.query(
        `INSERT INTO posts (author_id, category_id, title, slug, content, status, view_count, created_at) 
         VALUES ($1, 1, $2, $3, $4, 'published', $5, $6) RETURNING id`,
        [mojUserId, naslov, slug, sadrzaj, pregledi, datum]
      );

      const postId = res.rows[0].id;

      // Dodajemo nasumičan broj lajkova za svaki post
      const brojLajkova = faker.number.int({ min: 2, max: 15 });
      for (let j = 0; j < brojLajkova; j++) {
        // user_id 2 ili 3 (pretpostavljamo da postoje iz tvog DML-a)
        const glasačId = faker.helpers.arrayElement([2, 3, 4]);
        await pool.query(
          `INSERT INTO post_votes (user_id, post_id, vote_type) 
           VALUES ($1, $2, 1) ON CONFLICT DO NOTHING`,
          [glasačId, postId]
        );
      }
    }
    console.log("✅ Uspjeh! Tvoja baza sada ima 40 novih objava sa lajkovima.");
  } catch (err) {
    console.error("❌ Greška tokom popunjavanja:", err);
  } finally {
    await pool.end();
  }
}

popuniBazu();