import type { FC } from "react";

import { getYoutubeEmbedUrl } from "../core/utils/youtube";

interface YoutubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

const YoutubeEmbed: FC<YoutubeEmbedProps> = ({
  url,
  title = "YouTube video",
  className = "",
}) => {
  const embedUrl = getYoutubeEmbedUrl(url);

  if (!embedUrl) {
    return null;
  }

  return (
    <div className={`youtube-embed ${className}`.trim()}>
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};

export default YoutubeEmbed;
