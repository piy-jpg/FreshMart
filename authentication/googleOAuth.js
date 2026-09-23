const https = require('https');

async function verifyGoogleToken(idToken) {
  return new Promise((resolve, reject) => {
    https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error || !json.email) {
            return reject(new Error(json.error_description || 'Invalid Google token'));
          }
          resolve({
            email: json.email.toLowerCase(),
            name: json.name || json.email.split('@')[0],
            picture: json.picture,
            sub: json.sub
          });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

module.exports = {
  verifyGoogleToken
};
