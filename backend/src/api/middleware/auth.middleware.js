// MIDDLEWATE ZA ZASTITU ADMINSKIH RUTA
exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.adminId) {
    next();
  } else {
    res.status(401).json({ error: "Niste autorizovani kao administrator." });
  }
};
