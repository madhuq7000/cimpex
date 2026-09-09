import type { ChangeEvent, FC } from "react";

import { SERVER_URL } from "../core/config/env";
import { useLanguage } from "../core/context/LanguageContext";
import { getYoutubeVideoId } from "../core/utils/youtube";
import YoutubeEmbed from "./YoutubeEmbed";

interface VideoSourceFieldsProps {
  inputId: string;
  video: File | null;
  videoPreview?: string;
  youtubeUrl: string;
  existingVideo?: string;
  existingYoutubeUrl?: string;
  previewTitle?: string;
  onVideoChange: (file: File | null) => void;
  onYoutubeChange: (url: string) => void;
  onRemoveExistingVideo?: () => void;
  onRemoveExistingYoutube?: () => void;
  onError?: (message: string) => void;
}

const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
const allowedVideoExtensions = [".mp4", ".webm", ".ogg"];

const VideoSourceFields: FC<VideoSourceFieldsProps> = ({
  inputId,
  video,
  videoPreview,
  youtubeUrl,
  existingVideo,
  existingYoutubeUrl,
  previewTitle,
  onVideoChange,
  onYoutubeChange,
  onRemoveExistingVideo,
  onRemoveExistingYoutube,
  onError,
}) => {
  const { t } = useLanguage();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;

    if (file.size > 50 * 1024 * 1024) {
      onError?.(t("videoTooLarge"));
      event.target.value = "";
      return;
    }

    const isAllowed =
      allowedVideoTypes.includes(file.type) ||
      allowedVideoExtensions.includes(extension);

    if (!isAllowed) {
      onError?.(t("onlyVideoTypes"));
      event.target.value = "";
      return;
    }

    onVideoChange(file);
    event.target.value = "";
  };

  const handleRemoveFile = () => {
    onVideoChange(null);

    const input = document.getElementById(inputId) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };

  const previewUrl = youtubeUrl || existingYoutubeUrl || "";

  return (
    <div className="mb-4">
      <label className="field-label mb-2">
        {t("videoSource")} <span className="optional">{t("optional")}</span>
      </label>
      <p className="upload-hint mb-3">{t("youtubeHint")}</p>

      {existingVideo && !video && (
        <div className="mb-3">
          <small className="text-muted d-block mb-2">{t("currentVideo")}</small>
          <video
            src={`${SERVER_URL}${existingVideo}`}
            controls
            style={{
              width: "100%",
              maxWidth: "420px",
              maxHeight: "240px",
              borderRadius: "8px",
              background: "#000",
            }}
          />
          {onRemoveExistingVideo && (
            <button
              type="button"
              className="btn btn-sm btn-danger ms-2"
              onClick={onRemoveExistingVideo}
            >
              {t("remove")}
            </button>
          )}
        </div>
      )}

      <label htmlFor={inputId} className="upload-box" style={{ cursor: "pointer" }}>
        <i className="bi bi-camera-video d-block mb-2"></i>
        <div>{video ? video.name : t("dropVideo")}</div>
        <div>
          <span className="upload-link">{t("orClickBrowse")}</span>
        </div>
        <div className="upload-hint mt-1">{t("videoHint")}</div>
        <input
          type="file"
          id={inputId}
          accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg"
          className="d-none"
          onChange={handleFileChange}
        />
      </label>

      {videoPreview && (
        <div className="mt-3">
          <video
            src={videoPreview}
            controls
            style={{
              width: "100%",
              maxWidth: "420px",
              maxHeight: "240px",
              borderRadius: "8px",
              background: "#000",
            }}
          />
        </div>
      )}

      {video && (
        <div className="mt-2">
          <small className="text-muted">{t("selected", { name: video.name })}</small>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={handleRemoveFile}
          >
            {t("remove")}
          </button>
        </div>
      )}

      <div className="mt-3">
        <label className="field-label mb-2">{t("orUseYoutubeLink")}</label>
        <input
          type="url"
          className="form-control"
          value={youtubeUrl}
          onChange={(event) => onYoutubeChange(event.target.value)}
          placeholder={t("youtubeLinkPlaceholder")}
          disabled={Boolean(video)}
        />
      </div>

      {existingYoutubeUrl && !video && !youtubeUrl.trim() && (
        <div className="mt-3">
          <small className="text-muted d-block mb-2">{t("currentYoutubeVideo")}</small>
          <YoutubeEmbed
            url={existingYoutubeUrl}
            title={previewTitle || t("currentYoutubeVideo")}
            className="youtube-embed-preview"
          />
          {onRemoveExistingYoutube && (
            <button
              type="button"
              className="btn btn-sm btn-danger mt-2"
              onClick={onRemoveExistingYoutube}
            >
              {t("remove")}
            </button>
          )}
        </div>
      )}

      {getYoutubeVideoId(previewUrl) && !video && youtubeUrl.trim() && (
        <div className="mt-3">
          <YoutubeEmbed
            url={previewUrl}
            title={previewTitle || t("youtubeLink")}
            className="youtube-embed-preview"
          />
        </div>
      )}
    </div>
  );
};

export default VideoSourceFields;
