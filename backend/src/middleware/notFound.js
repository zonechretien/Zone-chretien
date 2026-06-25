// src/middleware/notFound.js
export const notFound = (req, res) => {
  res.status(404).json({ error: `Route introuvable: ${req.method} ${req.path}` });
};
