const LOCAL_API_URL = "http://localhost:3000";

const isLocalHostname = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

const getServerUrl = () => {
  const fromEnv = String(import.meta.env.VITE_SERVER_URL || "").trim();

  if (typeof window !== "undefined" && window.location?.hostname) {
    if (isLocalHostname(window.location.hostname)) {
      return (fromEnv || LOCAL_API_URL).replace(/\/+$/, "");
    }

    return window.location.origin.replace(/\/+$/, "");
  }

  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return LOCAL_API_URL;
  }

  return "https://www.amarsavimarsa.com";
};

export const SERVER_URL = getServerUrl();

export const API_URL = `${SERVER_URL}/api`;
