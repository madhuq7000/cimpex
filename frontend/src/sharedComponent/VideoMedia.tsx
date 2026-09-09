import type { FC } from "react";

import { SERVER_URL } from "../core/config/env";
import { useLanguage } from "../core/context/LanguageContext";
import YoutubeEmbed from "./YoutubeEmbed";

interface VideoMediaProps {
  video?: string;
  youtubeUrl?: string;
  title?: string;
  variant?: "thumb" | "wide";
}

const VideoMedia: FC<VideoMediaProps> = ({
  video,
  youtubeUrl,
  title,
  variant = "thumb",
}) => {
  const { t } = useLanguage();

  if (video) {
    return (
      <video
        className={variant === "wide" ? "discussion-wide-video" : "discussion-list-video"}
        src={`${SERVER_URL}${video}`}
        controls
        playsInline
        preload="metadata"
        onClick={(event) => event.stopPropagation()}
      >
        {t("videoNotSupported")}
      </video>
    );
  }

  if (youtubeUrl) {
    return (
      <YoutubeEmbed
        url={youtubeUrl}
        title={title}
        className={variant === "wide" ? "youtube-embed-wide" : undefined}
      />
    );
  }

  return null;
};

export default VideoMedia;
