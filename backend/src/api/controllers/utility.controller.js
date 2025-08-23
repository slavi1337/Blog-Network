const { translate } = require("@vitalets/google-translate-api");

exports.translateText = async (req, res) => {
  const { text, targetLang, isHtml } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: "Tekst i ciljni jezik su obavezni." });
  }

  try {
    const result = await translate(text, { to: targetLang, from: "auto" });

    res.status(200).json({ translatedText: result.text });
  } catch (error) {
    console.error("Greška pri prevođenju na backendu:", error);
    res
      .status(500)
      .json({ error: "Usluga za prevođenje trenutno nije dostupna." });
  }
};
