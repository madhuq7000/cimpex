const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const backendBase = (req) => {
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "http")
    .split(",")[0]
    .trim();
  const host = req.get("host");
  return `${proto}://${host}`;
};

const allowedFrontendOrigins = () => {
  const extras = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "https://www.amarsavimarsa.com",
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

const defaultFrontend = () => {
  const fromEnv = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .find(Boolean);

  return fromEnv || "http://localhost:5173";
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

const frontendFromState = (state) => {
  const origin = decodeState(state).redirect;
  return isAllowedFrontend(origin) ? origin : defaultFrontend();
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

    return user;
  }

  if (googleId && !user.googleId) {
    user.googleId = googleId;
  }

  if (facebookId && !user.facebookId) {
    user.facebookId = facebookId;
  }

  if ((!user.profileImage || user.profileImage === "default-profile.png") && picture) {
    user.profileImage = picture;
  }

  await user.save();
  return user;
};

const finishLogin = (res, frontend, user) => {
  if (user.isActive === false) {
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
    : defaultFrontend();

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return redirectWithError(
      res,
      frontend,
      "Google login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.",
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${backendBase(req)}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state: encodeState({ redirect: frontend }),
  });

  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
};

const googleCallback = async (req, res) => {
  const frontend = frontendFromState(req.query.state);

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
        redirect_uri: `${backendBase(req)}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
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
    : defaultFrontend();

  if (!appId || !process.env.FACEBOOK_APP_SECRET) {
    return redirectWithError(
      res,
      frontend,
      "Facebook login is not configured. Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET on the server.",
    );
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${backendBase(req)}/api/auth/facebook/callback`,
    scope: "email,public_profile",
    state: encodeState({ redirect: frontend }),
  });

  return res.redirect(
    `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`,
  );
};

const facebookCallback = async (req, res) => {
  const frontend = frontendFromState(req.query.state);

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

    const redirectUri = `${backendBase(req)}/api/auth/facebook/callback`;
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
