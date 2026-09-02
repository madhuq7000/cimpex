const getServerUrl = () => {
  const fromEnv = String(import.meta.env.VITE_SERVER_URL || "").trim();

  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "https://www.vaadsamvaad.com";
};

export const SERVER_URL = getServerUrl();

export const API_URL = `${SERVER_URL}/api`;
