const {
  discovery,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  fetchUserInfo,
} = require("openid-client");

let googleConfigPromise = null;


const getGoogleConfig = async () => {
  if (!googleConfigPromise) {
    googleConfigPromise = discovery(
      new URL("https://accounts.google.com"),
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
  }

  return googleConfigPromise;
};


const getAuthorizationUrl = async (
  state,
  codeVerifier,
  nonce
) => {
  const config = await getGoogleConfig();

  const codeChallenge =
    await calculatePKCECodeChallenge(
      codeVerifier
    );

  const authorizationUrl =
    buildAuthorizationUrl(
      config,
      {
        redirect_uri:
          process.env.GOOGLE_REDIRECT_URI,

        scope:
          "openid email profile",

        response_type:
          "code",

        state,

        nonce,

        code_challenge:
          codeChallenge,

        code_challenge_method:
          "S256",
      }
    );

  return authorizationUrl;
};

const exchangeCodeForTokens = async (
  currentUrl,
  codeVerifier,
  expectedState,
  expectedNonce
) => {
  const config = await getGoogleConfig();

  return authorizationCodeGrant(
    config,
    currentUrl,
    {
      pkceCodeVerifier: codeVerifier,
      expectedState,
      expectedNonce,
      idTokenExpected: true,
    }
  );
};


const getGoogleUserInfo = async (
  config,
  accessToken
) => {
  return fetchUserInfo(
    config,
    accessToken
  );
};


module.exports = {
  getGoogleConfig,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
};
