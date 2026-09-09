import { SERVER_URL } from "../config/env";
import defaultCompetitionImage from "../../assets/images/default-competition.png";
import defaultDiscussionImage from "../../assets/images/default-discussion.png";

export const DEFAULT_DISCUSSION_IMAGE = defaultDiscussionImage;
export const DEFAULT_COMPETITION_IMAGE = defaultCompetitionImage;

export function getUploadedMediaUrl(path?: string | null) {
  if (!path || !path.trim()) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${SERVER_URL}${path}`;
  }

  return `${SERVER_URL}/${path}`;
}

export function getDiscussionImageUrl(path?: string | null) {
  return getUploadedMediaUrl(path) || DEFAULT_DISCUSSION_IMAGE;
}

export function getCompetitionImageUrl(path?: string | null) {
  return getUploadedMediaUrl(path) || DEFAULT_COMPETITION_IMAGE;
}
