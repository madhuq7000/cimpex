const SUPER_ADMIN_EMAILS = [
  "rakesh@dsnlegal.com",
  "amitq7000@gmail.com",
];

const COMPETITION_ADMIN_EMAILS = [
  "rakesh@dsnlegal.com",
  "amitq7000@gmail.com",
  "kamakshisoni9@gmail.com",
  "snehaghosh3042004@gmail.com",
];

const normalizeEmail = (email) =>
  String(email || "")
    .toLowerCase()
    .trim();

const isSuperAdminUser = (user) =>
  SUPER_ADMIN_EMAILS.includes(normalizeEmail(user?.email));

const isCompetitionAdminUser = (user) =>
  COMPETITION_ADMIN_EMAILS.includes(normalizeEmail(user?.email)) ||
  isSuperAdminUser(user);

const getUserId = (user) =>
  String(user?._id || user?.userId || user?.id || "");

const isSameUserId = (left, right) => {
  const a = String(left || "");
  const b = String(right || "");
  return Boolean(a && b && a === b);
};

const canSeeOthersCompetitionContent = (user) => isCompetitionAdminUser(user);

const redactCompetitionPayload = (competition, user) => {
  if (!competition) {
    return competition;
  }

  if (canSeeOthersCompetitionContent(user)) {
    return competition;
  }

  const viewerId = getUserId(user);
  const ownerId = String(
    competition.createdBy?._id || competition.createdBy || "",
  );
  const isOwner = isSameUserId(viewerId, ownerId);

  const next = { ...competition };

  if (!isOwner) {
    next.description = "";
  }

  return next;
};

const filterOwnedItems = (items, user, getOwnerId) => {
  if (!Array.isArray(items)) {
    return [];
  }

  if (canSeeOthersCompetitionContent(user)) {
    return items;
  }

  const viewerId = getUserId(user);

  if (!viewerId) {
    return [];
  }

  return items.filter((item) => isSameUserId(viewerId, getOwnerId(item)));
};

module.exports = {
  SUPER_ADMIN_EMAILS,
  COMPETITION_ADMIN_EMAILS,
  isSuperAdminUser,
  isCompetitionAdminUser,
  canSeeOthersCompetitionContent,
  redactCompetitionPayload,
  filterOwnedItems,
  getUserId,
  isSameUserId,
};
