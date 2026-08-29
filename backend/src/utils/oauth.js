const crypto = require("crypto");


// Generate random state
const generateState = () => {
  return crypto.randomBytes(32).toString("hex");
};


// Generate PKCE verifier
const generateCodeVerifier = () => {
  return crypto
    .randomBytes(32)
    .toString("base64url");
};


// Generate PKCE challenge
const generateCodeChallenge = (
  codeVerifier
) => {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
};

const generateNonce = () => {
  return crypto.randomBytes(32).toString("hex");
};


module.exports = {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  generateNonce
};