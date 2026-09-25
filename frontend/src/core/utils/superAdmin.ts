export const SUPER_ADMIN_EMAIL = "rakesh@dsnlegal.com";

export const SUPER_ADMIN_EMAILS = [
  "rakesh@dsnlegal.com",
  "amitq7000@gmail.com",
];

export const COMPETITION_ADMIN_EMAILS = [
  "rakesh@dsnlegal.com",
  "amitq7000@gmail.com",
  "kamakshisoni9@gmail.com",
  "snehaghosh3042004@gmail.com",
];

const normalizeEmail = (email?: string | null) =>
  String(email || "")
    .toLowerCase()
    .trim();

export const isSuperAdminEmail = (email?: string | null) =>
  SUPER_ADMIN_EMAILS.includes(normalizeEmail(email));

export const isCompetitionAdminEmail = (email?: string | null) =>
  COMPETITION_ADMIN_EMAILS.includes(normalizeEmail(email)) ||
  isSuperAdminEmail(email);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isLoggedInSuperAdmin = () => {
  const user = getStoredUser();
  return isSuperAdminEmail(user?.email);
};

export const isLoggedInCompetitionAdmin = () => {
  const user = getStoredUser();
  return isCompetitionAdminEmail(user?.email);
};
