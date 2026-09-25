const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const LOCAL_API_ORIGIN = () => `http://localhost:${process.env.PORT || 3000}`;
const LOCAL_FRONTEND_ORIGIN = "http://localhost:5173";
const PRODUCTION_API_ORIGIN = "https://www.amarsavimarsa.com";
const PRODUCTION_FRONTEND_ORIGIN = "https://www.amarsavimarsa.com";

const isLoopbackHost = (host = "") =>
  /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(host).trim());

const tryParseOrigin = (value = "") => {
  try {
    return new URL(String(value)).origin;
  } catch {
    return "";
  }
};

const envOrigins = (key) =>
  String(process.env[key] || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const productionApiOrigin = () => {
  const fromEnv = envOrigins("PUBLIC_API_URL")
    .concat(envOrigins("PUBLIC_SERVER_URL"))
    .map(tryParseOrigin)
    .find((origin) => origin && !isLoopbackHost(new URL(origin).host));

  return fromEnv || PRODUCTION_API_ORIGIN;
};

const localApiOrigin = () => {
  const fromEnv = envOrigins("LOCAL_PUBLIC_API_URL")
    .map(tryParseOrigin)
    .find(Boolean);

  return fromEnv || LOCAL_API_ORIGIN();
};

/**
 * Decide local vs live from the browser that started OAuth.
 * SocialLoginButtons always sends ?redirect=window.location.origin
 */
const isLocalOAuthRequest = (req, frontendOrigin = "") => {
  const candidates = [
    frontendOrigin,
    req.query?.redirect,
    req.get("origin"),
    req.get("referer"),
  ];

  for (const value of candidates) {
    const origin = tryParseOrigin(value);
    if (origin && isLoopbackHost(new URL(origin).host)) {
      return true;
    }
  }

  const host = String(req.headers["x-forwarded-host"] || req.get("host") || "")
    .split(",")[0]
    .trim();

  // Pure local Node (no nginx): host is localhost and no production frontend hint.
  if (isLoopbackHost(host)) {
    const hasProductionHint = candidates.some((value) =>
      /amarsavimarsa\.com/i.test(String(value || "")),
    );
    return !hasProductionHint;
  }

  return false;
};

/**
 * OAuth redirect_uri API origin — picks localhost on local, live URL on server.
 * PUBLIC_API_URL can stay set to production; local logins still use localhost.
 */
const backendBase = (req, frontendOrigin = "") => {
  if (isLocalOAuthRequest(req, frontendOrigin)) {
    return localApiOrigin();
  }

  const forwardedHost = String(req.headers["x-forwarded-host"] || "")
    .split(",")[0]
    .trim();
  const host = forwardedHost || String(req.get("host") || "").trim();

  if (host && !isLoopbackHost(host)) {
    let proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https")
      .split(",")[0]
      .trim()
      .toLowerCase();

    if (proto === "http") {
      proto = "https";
    }

    return `${proto}://${host}`;
  }

  return productionApiOrigin();
};

const allowedFrontendOrigins = () => {
  const extras = envOrigins("CLIENT_URL");

  return new Set([
    LOCAL_FRONTEND_ORIGIN,
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    PRODUCTION_FRONTEND_ORIGIN,
    "https://amarsavimarsa.com",
    ...extras,
  ]);
};

const isAllowedFrontend = (origin) => {
  if (!origin) {
    return false;
  }

  if (allowedFrontendOrigins().has(origin)) {
    return true;
  }

  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
};

const defaultFrontend = (req) => {
  const configured = envOrigins("CLIENT_URL");

  if (isLocalOAuthRequest(req)) {
    const local = configured.find((origin) => {
      try {
        return isLoopbackHost(new URL(origin).host);
      } catch {
        return false;
      }
    });
    return local || LOCAL_FRONTEND_ORIGIN;
  }

  const live = configured.find((origin) => {
    try {
      return !isLoopbackHost(new URL(origin).host);
    } catch {
      return false;
    }
  });

  return live || PRODUCTION_FRONTEND_ORIGIN;
};

const encodeState = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

const decodeState = (state) => {
  try {
    return JSON.parse(Buffer.from(String(state || ""), "base64url").toString());
  } catch {
    return {};
  }
};

const frontendFromState = (state, req) => {
  const origin = decodeState(state).redirect;
  return isAllowedFrontend(origin) ? origin : defaultFrontend(req);
};

const redirectUriFromState = (state, fallback) => {
  const fromState = String(decodeState(state).redirectUri || "").trim();
  return fromState || fallback;
};

const redirectWithError = (res, frontend, message) => {
  const url = new URL("/login", frontend);
  url.searchParams.set("error", message);
  return res.redirect(url.toString());
};

const upsertSocialUser = async ({
  email,
  name,
  picture,
  googleId,
  facebookId,
}) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();

  if (!normalizedEmail) {
    throw new Error("Email permission is required to sign in.");
  }

  let user =
    (googleId && (await User.findOne({ googleId }))) ||
    (facebookId && (await User.findOne({ facebookId }))) ||
    (await User.findOne({ email: normalizedEmail }));

  if (!user) {
    let displayName = String(name || "").trim();

    if (displayName.length < 2) {
      displayName = normalizedEmail.split("@")[0];
    }

    if (displayName.length < 2) {
      displayName = "User";
    }

    const randomPassword = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12);

    user = await User.create({
      name: displayName.slice(0, 100),
      email: normalizedEmail,
      password: randomPassword,
      profileImage: picture || "default-profile.png",
      googleId: googleId || undefined,
      facebookId: facebookId || undefined,
    });
  } else {
    if (googleId && !user.googleId) {
      user.googleId = googleId;
    }

    if (facebookId && !user.facebookId) {
      user.facebookId = facebookId;
    }

    if (picture && (!user.profileImage || user.profileImage === "default-profile.png")) {
      user.profileImage = picture;
    }

    await user.save();
  }

  return user;
};

const finishLogin = (res, frontend, user) => {
  if (user.status && user.status !== "active") {
    return redirectWithError(res, frontend, "This account is inactive.");
  }

  const token = createToken(user._id);
  const url = new URL("/oauth-callback", frontend);
  url.searchParams.set("token", token);
  return res.redirect(url.toString());
};

const startGoogle = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const frontend = isAllowedFrontend(req.query.redirect)
    ? String(req.query.redirect)
    : defaultFrontend(req);

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return redirectWithError(
      res,
      frontend,
      "Google login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.",
    );
  }

  const redirectUri = `${backendBase(req, frontend)}/api/auth/google/callback`;
  console.log("Google OAuth start redirect_uri:", redirectUri, "frontend:", frontend);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state: encodeState({ redirect: frontend, redirectUri }),
  });

  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
};

const googleCallback = async (req, res) => {
  const state = req.query.state;
  const frontend = frontendFromState(state, req);
  const redirectUri = redirectUriFromState(
    state,
    `${backendBase(req, frontend)}/api/auth/google/callback`,
  );

  try {
    if (req.query.error) {
      return redirectWithError(res, frontend, "Google sign-in was cancelled.");
    }

    const code = String(req.query.code || "");

    if (!code) {
      return redirectWithError(res, frontend, "Google did not return an authorization code.");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return redirectWithError(res, frontend, "Google token exchange failed.");
    }

    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );
    const profile = await profileResponse.json();

    const user = await upsertSocialUser({
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      googleId: profile.id,
    });

    return finishLogin(res, frontend, user);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return redirectWithError(
      res,
      frontend,
      error.message || "Google sign-in failed.",
    );
  }
};

const startFacebook = (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const frontend = isAllowedFrontend(req.query.redirect)
    ? String(req.query.redirect)
    : defaultFrontend(req);

  if (!appId || !process.env.FACEBOOK_APP_SECRET) {
    return redirectWithError(
      res,
      frontend,
      "Facebook login is not configured. Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET on the server.",
    );
  }

  const redirectUri = `${backendBase(req, frontend)}/api/auth/facebook/callback`;
  console.log("Facebook OAuth start redirect_uri:", redirectUri, "frontend:", frontend);

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "email,public_profile",
    state: encodeState({ redirect: frontend, redirectUri }),
  });

  return res.redirect(
    `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`,
  );
};

const facebookCallback = async (req, res) => {
  const state = req.query.state;
  const frontend = frontendFromState(state, req);
  const redirectUri = redirectUriFromState(
    state,
    `${backendBase(req, frontend)}/api/auth/facebook/callback`,
  );

  try {
    if (req.query.error) {
      return redirectWithError(res, frontend, "Facebook sign-in was cancelled.");
    }

    const code = String(req.query.code || "");

    if (!code) {
      return redirectWithError(
        res,
        frontend,
        "Facebook did not return an authorization code.",
      );
    }

    const tokenParams = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: redirectUri,
      code,
    });

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`,
    );
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Facebook token exchange failed:", tokenData);
      return redirectWithError(res, frontend, "Facebook token exchange failed.");
    }

    const profileResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(
        tokenData.access_token,
      )}`,
    );
    const profile = await profileResponse.json();

    const user = await upsertSocialUser({
      email: profile.email,
      name: profile.name,
      picture: profile.picture?.data?.url,
      facebookId: profile.id,
    });

    return finishLogin(res, frontend, user);
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    return redirectWithError(
      res,
      frontend,
      error.message || "Facebook sign-in failed.",
    );
  }
};

module.exports = {
  startGoogle,
  googleCallback,
  startFacebook,
  facebookCallback,
};
