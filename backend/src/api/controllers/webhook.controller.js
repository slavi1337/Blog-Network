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
  console.log(`Webhook primljen. Tip događaja: ${type}`);

  try {
    switch (type) {
      case "user.created":
        console.log("Obrađujem 'user.created'...");
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
          console.error("Korisnik nema email, preskače se kreiranje.");
          break;
        }

        const dbUsername =
          username || email.split("@")[0] + Math.floor(Math.random() * 1000);

        await pool.query(
          `INSERT INTO users (clerk_id, username, email, first_name, last_name, role, profile_picture_url)
           VALUES ($1, $2, $3, $4, $5, 'standard', $6)
           ON CONFLICT (clerk_id) DO NOTHING`,
          [id, dbUsername, email, first_name, last_name, image_url]
        );
        console.log(
          `Korisnik sa Clerk ID ${id} uspješno unesen ili već postoji.`
        );
        break;

      case "user.updated":
        console.log("Obrađujem 'user.updated'...");
        const {
          id: updatedClerkId,
          first_name: updatedFirstName,
          last_name: updatedLastName,
          username: updatedUsername,
          image_url: updatedImageUrl,
        } = data;

        await pool.query(
          `UPDATE users 
           SET first_name = $1, last_name = $2, username = $3, profile_picture_url = $4
           WHERE clerk_id = $5`,
          [
            updatedFirstName,
            updatedLastName,
            updatedUsername,
            updatedImageUrl,
            updatedClerkId,
          ]
        );
        console.log(
          `Korisnik sa Clerk ID ${updatedClerkId} uspješno ažuriran.`
        );
        break;

      case "user.deleted":
        console.log("Obrađujem 'user.deleted'...");
        const { id: deletedClerkId } = data;

        const deleteResult = await pool.query(
          `DELETE FROM users WHERE clerk_id = $1`,
          [deletedClerkId]
        );

        if (deleteResult.rowCount > 0) {
          console.log(
            `Korisnik sa Clerk ID ${deletedClerkId} uspješno obrisan iz baze.`
          );
        } else {
          console.log(
            `Korisnik sa Clerk ID ${deletedClerkId} nije pronađen u bazi.`
          );
        }
        break;

      default:
        console.log(`Događaj '${type}' primljen, ali se ne obrađuje.`);
    }

    res.status(200).json({ success: true, message: "Webhook obrađen." });
  } catch (dbErr) {
    console.error(`Database error pri obradi događaja '${type}':`, dbErr);
    res.status(500).json({ error: "Internal server error." });
  }
};
