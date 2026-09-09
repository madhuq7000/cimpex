const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export const getYoutubeVideoId = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (YOUTUBE_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return YOUTUBE_ID_PATTERN.test(id) ? id : "";
    }

    const allowedHosts = [
      "youtube.com",
      "m.youtube.com",
      "music.youtube.com",
      "youtube-nocookie.com",
    ];

    if (!allowedHosts.includes(host)) {
      return "";
    }

    const fromQuery = url.searchParams.get("v");

    if (fromQuery && YOUTUBE_ID_PATTERN.test(fromQuery)) {
      return fromQuery;
    }

    const parts = url.pathname.split("/").filter(Boolean);

    if (
      parts[0] &&
      ["embed", "shorts", "live", "v"].includes(parts[0]) &&
      parts[1] &&
      YOUTUBE_ID_PATTERN.test(parts[1])
    ) {
      return parts[1];
    }
  } catch {
    return "";
  }

  return "";
};

export const getYoutubeEmbedUrl = (value?: string | null) => {
  const id = getYoutubeVideoId(value);
  return id ? `https://www.youtube.com/embed/${id}` : "";
};
