// Vercel Serverless Function entrypoint
const { server } = require("../server");

module.exports = (req, res) => {
  // In Vercel, x-matched-path contains the original path requested by the client
  const matchedPath = req.headers['x-matched-path'];
  if (matchedPath && matchedPath.startsWith('/api')) {
    const urlParts = req.url.split('?');
    const query = urlParts.length > 1 ? '?' + urlParts.slice(1).join('?') : '';
    req.url = matchedPath + query;
  }

  server.emit("request", req, res);
};

