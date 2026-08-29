const authConfig = require("../config/auth");

const oauthCookieOptions = {
  ...authConfig.cookieOptions,
  path: "/",
  maxAge: 10 * 60 * 1000,
};

module.exports = {
  oauthCookieOptions,
};