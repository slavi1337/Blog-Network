const { Webhook } = require("svix");
const { pool } = require("../../config/db");

exports.handleClerkWebhook = async (req, res) => {
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

    const { id, email_addresses, first_name, last_name, username, image_url } =
      data;
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

      const values = [id, dbUsername, email, first_name, last_name, image_url];
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
};
