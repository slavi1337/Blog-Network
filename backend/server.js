require("dotenv").config();
const express = require("express");
const { Webhook } = require("svix");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
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

// Middleware za parsiranje JSON body-ja
app.use(express.json());

// Endpoint za webhook za kreiranje korisnika
app.post(
  "/api/webhooks/clerk",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error("Greska: CLERK_WEBHOOK_SECRET nije podesen na serveru.");
      return res.status(500).send("Webhook secrte nije konfigurisan.");
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
        return res
          .status(200)
          .json({ message: "Korisnik nema email, preskace se." });
      }

      try {
        const dbUsername =
          username || email.split("@")[0] + Math.floor(Math.random() * 1000);

        const query = `
        INSERT INTO users (clerk_id, username, email, first_name, last_name, profile_picture_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (clerk_id) DO NOTHING;`;

        const values = [
          id,
          dbUsername,
          email,
          first_name,
          last_name,
          image_url,
        ];
        await pool.query(query, values);

        console.log(`Korisnik ${dbUsername} je obradjen.`);
        res.status(201).send("Webhook uspešno obradjen.");
      } catch (dbErr) {
        console.error("Database error:", dbErr);
        res.status(500).json({ error: "Internal server error." });
      }
    } else {
      res.status(200).send("Webhook primljen ali nije obradjen.");
    }
  }
);

app.use(express.static(path.join(__dirname, "../dist")));

// "Catch-all" ruta za sve ostale req
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

// Pokretanje servera
app.listen(port, () => {
  console.log(`Backend server slusa na http://localhost:${port}`);
});
