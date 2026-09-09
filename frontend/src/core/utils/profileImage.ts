import type { SyntheticEvent } from "react";

import { SERVER_URL } from "../config/env";
import defaultProfileImage from "../../assets/images/default-profile.png";

export const DEFAULT_PROFILE_IMAGE = defaultProfileImage;

export function getProfileImageUrl(profileImage?: string | null) {
  if (
    !profileImage ||
    profileImage.trim() === "" ||
    profileImage === "default-profile.png"
  ) {
    return DEFAULT_PROFILE_IMAGE;
  }

  if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
    return profileImage;
  }

  if (profileImage.startsWith("/uploads/")) {
    return `${SERVER_URL}${profileImage}`;
  }

  if (profileImage.startsWith("uploads/")) {
    return `${SERVER_URL}/${profileImage}`;
  }

  return `${SERVER_URL}/uploads/profiles/${profileImage}`;
}

export function handleProfileImageError(
  event: SyntheticEvent<HTMLImageElement>,
) {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") {
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = DEFAULT_PROFILE_IMAGE;
}
