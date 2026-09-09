import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { API_URL } from "../../../core/config/env";
import { useLanguage } from "../../../core/context/LanguageContext";
import { getYoutubeVideoId } from "../../../core/utils/youtube";
import VideoSourceFields from "../../../sharedComponent/VideoSourceFields";
import ImageSourceFields from "../../../sharedComponent/ImageSourceFields";
import MediaAttachSelect, {
  type MediaAttachKind,
} from "../../../sharedComponent/MediaAttachSelect";

const StartCompetition: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [mediaKind, setMediaKind] = useState<MediaAttachKind>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!video) {
      setVideoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(video);
    setVideoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [video]);

  const handleVideoFileChange = (file: File | null) => {
    setError("");
    setVideo(file);

    if (file) {
      setYoutubeUrl("");
    }
  };

  const handleYoutubeUrlChange = (value: string) => {
    setYoutubeUrl(value);

    if (value.trim()) {
      setVideo(null);
    }
  };

  const handleMediaKindChange = (nextKind: MediaAttachKind) => {
    setMediaKind(nextKind);
    setError("");

    if (nextKind !== "image") {
      setImage(null);
    }

    if (nextKind !== "video") {
      setVideo(null);
      setYoutubeUrl("");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setError(t("competitionTopicRequired"));
      return;
    }

    if (
      mediaKind === "video" &&
      youtubeUrl.trim() &&
      !getYoutubeVideoId(youtubeUrl)
    ) {
      setError(t("invalidYoutubeLink"));
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append(
        "youtubeUrl",
        mediaKind === "video" ? youtubeUrl.trim() : "",
      );

      if (mediaKind === "video" && video) {
        formData.append("video", video);
      }

      if (mediaKind === "image" && image) {
        formData.append("image", image);
      }

      const response = await axios.post(`${API_URL}/competitions`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const competitionId = response.data?.data?._id;

      if (competitionId) {
        navigate(`/competitions/${competitionId}`);
        return;
      }

      navigate("/competitions");
    } catch (submitError: any) {
      setError(
        submitError.response?.data?.message || t("failedCreateCompetition"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="discussion-card">
      <h2 className="mb-1">{t("startNewCompetition")}</h2>
      <p className="text-muted mb-4">{t("competitionIntro")}</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="field-label mb-2">{t("competitionTopic")}</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("competitionTopicPlaceholder")}
          />
        </div>

        <div className="mb-4">
          <label className="field-label mb-2">
            {t("description")} <span className="optional">{t("optional")}</span>
          </label>
          <textarea
            className="form-control"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("competitionDescriptionPlaceholder")}
          />
        </div>

        <MediaAttachSelect
          value={mediaKind}
          options={["image", "video"]}
          onChange={handleMediaKindChange}
        />

        {mediaKind === "video" && (
          <VideoSourceFields
            inputId="competitionCreateVideoInput"
            video={video}
            videoPreview={videoPreview}
            youtubeUrl={youtubeUrl}
            previewTitle={title}
            onVideoChange={handleVideoFileChange}
            onYoutubeChange={handleYoutubeUrlChange}
            onError={setError}
          />
        )}

        {mediaKind === "image" && (
          <ImageSourceFields
            inputId="competitionCreateImageInput"
            image={image}
            onImageChange={(file) => {
              setError("");
              setImage(file);
            }}
            onError={setError}
          />
        )}

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/competitions")}
          >
            {t("cancel")}
          </button>
          <button type="submit" className="btn btn-brand" disabled={loading}>
            {loading ? t("starting") : t("startCompetition")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartCompetition;
