const { imagekit } = require("../../config/imagekit");

exports.getUploadAuth = (req, res) => {
  const authenticationParameters = imagekit.getAuthenticationParameters();
  res.json(authenticationParameters);
};

// RACUNANJE VELICINE SLIKA/VIDEA KOJE SU UPLOADANE ZA BLOG
exports.getMediaDetails = async (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(200).json([]);
  }

  try {
    const detailPromises = urls.map(async (url) => {
      try {
        const fileName = url.substring(url.lastIndexOf("/") + 1);

        const list = await imagekit.listFiles({
          searchQuery: `name="${fileName}"`,
        });

        if (list && list.length === 1) {
          const file = list[0];
          return {
            url: file.url,
            size: file.size,
          };
        }
        return null;
      } catch (e) {
        console.error(`Greška pri dohvatanju detalja za ${url}:`, e);
        return null;
      }
    });

    const results = await Promise.all(detailPromises);

    const successfulDetails = results.filter((item) => item !== null);

    res.status(200).json(successfulDetails);
  } catch (error) {
    console.error("Glavna greška pri dohvatanju detalja sa ImageKit-a:", error);
    res.status(500).json({ error: "Greška pri provjeri veličine fajlova." });
  }
};
