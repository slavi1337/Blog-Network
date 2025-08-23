const { pool } = require("../../config/db");

// DOHVATANJE KATEGORIJA IZ BAZE
exports.getAllCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name FROM categories ORDER BY name ASC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju kategorija:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};

// DOHVATANJE TAGOVA IZ BAZE
exports.getAllTags = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name FROM tags ORDER BY name ASC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Greška pri dohvatanju tagova:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};
