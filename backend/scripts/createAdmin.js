require("dotenv").config();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const createAdmin = async () => {
  // inicijalni adminski nalog - kreira se ovim fajlom
  // potrebno unijeti korisnicko ime i lozinku ispod
  const username = "";
  const password = "";

  // hashovanje sifre
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  try {
    await pool.query(
      "INSERT INTO admins (username, password_hash) VALUES ($1, $2)",
      [username, passwordHash]
    );
    console.log(`Admin korisnik "${username}" je uspješno kreiran.`);
  } catch (error) {
    console.error("Greška pri kreiranju admina:", error.message);
  } finally {
    await pool.end();
  }
};

createAdmin();
