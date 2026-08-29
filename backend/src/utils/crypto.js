const crypto = require("crypto");


// Generate a secure random token
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};


// Hash a token before storing it
const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};


module.exports = {
  generateSecureToken,
  hashToken,
};