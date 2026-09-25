import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";

import { API_URL } from "../../../core/config/env";
import { useLanguage } from "../../../core/context/LanguageContext";
import { getYoutubeVideoId } from "../../../core/utils/youtube";
import {
  isCompetitionAdminEmail,
  getStoredUser,
} from "../../../core/utils/superAdmin";
import VideoSourceFields from "../../../sharedComponent/VideoSourceFields";
import ImageSourceFields from "../../../sharedComponent/ImageSourceFields";
import MediaAttachSelect, {
  type MediaAttachKind,
} from "../../../sharedComponent/MediaAttachSelect";
import EditorToolbar from "../../../sharedComponent/EditorToolbar";
import { getBaseEditorExtensions } from "../../../sharedComponent/editorExtensions";

const htmlHasReadableText = (html: string) =>
  String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0;

const StartCompetition: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const { t } = useLanguage();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [existingVideo, setExistingVideo] = useState("");
  const [existingYoutubeUrl, setExistingYoutubeUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [removeExistingVideo, setRemoveExistingVideo] = useState(false);
  const [removeExistingYoutube, setRemoveExistingYoutube] = useState(false);
  const [mediaKind, setMediaKind] = useState<MediaAttachKind>("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");

  const editor = useEditor({
    extensions: getBaseEditorExtensions(),
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      setDescription(activeEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!video) {
      setVideoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(video);
    setVideoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [video]);

  useEffect(() => {
    if (!isEditMode || !id || !editor) {
      return;
    }

    const loadCompetition = async () => {
      try {
        setPageLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_URL}/competitions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const competition = response.data?.data;
        if (!competition) {
          setError(t("competitionNotFound"));
          return;
        }

        const storedUser = getStoredUser();
        const currentUserId = String(
          storedUser?.id || storedUser?._id || "",
        );
        const ownerId = String(
          competition.createdBy?._id || competition.createdBy || "",
        );
        const canEdit =
          isCompetitionAdminEmail(storedUser?.email) ||
          (currentUserId && currentUserId === ownerId);

        if (!canEdit) {
          setError(t("notAuthorizedEditCompetition"));
          return;
        }

        setTitle(competition.title || "");
        setDescription(competition.description || "");
        editor.commands.setContent(competition.description || "");
        setExistingImage(competition.image || "");
        setExistingVideo(competition.video || "");
        setExistingYoutubeUrl(competition.youtubeUrl || "");
        setYoutubeUrl(competition.youtubeUrl || "");

        if (competition.video || competition.youtubeUrl) {
          setMediaKind("video");
        } else if (competition.image) {
          setMediaKind("image");
        }
      } catch (loadError: any) {
        setError(
          loadError.response?.data?.message || t("failedLoadCompetition"),
        );
      } finally {
        setPageLoading(false);
      }
    };

    void loadCompetition();
  }, [editor, id, isEditMode, navigate, t]);

  const handleSetLink = () => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "https://");

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleRemoveLink = () => {
    editor?.chain().focus().unsetLink().run();
  };

  const handleEmoji = () => {
    const emoji = window.prompt("Enter emoji", "🙂");
    if (emoji) {
      editor?.chain().focus().insertContent(emoji).run();
    }
  };

  const handleVideoFileChange = (file: File | null) => {
    setError("");
    setVideo(file);
    setRemoveExistingVideo(false);

    if (file) {
      setYoutubeUrl("");
      setRemoveExistingYoutube(true);
    }
  };

  const handleYoutubeUrlChange = (value: string) => {
    setYoutubeUrl(value);

    if (value.trim()) {
      setVideo(null);
      setRemoveExistingVideo(true);
      setRemoveExistingYoutube(false);
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

    const html = editor?.getHTML() || description;

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
      formData.append(
        "description",
        htmlHasReadableText(html) || /<img\s/i.test(html) ? html : "",
      );
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

      if (isEditMode) {
        if (removeExistingImage) {
          formData.append("removeImage", "true");
        }
        if (removeExistingVideo) {
          formData.append("removeVideo", "true");
        }
        if (removeExistingYoutube || (mediaKind !== "video" && existingYoutubeUrl)) {
          formData.append("removeYoutube", "true");
        }
        if (mediaKind !== "image" && existingImage) {
          formData.append("removeImage", "true");
        }
        if (mediaKind !== "video" && existingVideo) {
          formData.append("removeVideo", "true");
        }
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (isEditMode && id) {
        await axios.post(
          `${API_URL}/competitions/${id}/update`,
          formData,
          config,
        );
        navigate(`/competitions/${id}`);
        return;
      }

      const response = await axios.post(
        `${API_URL}/competitions`,
        formData,
        config,
      );

      const competitionId = response.data?.data?._id;

      if (competitionId) {
        navigate(`/competitions/${competitionId}`);
        return;
      }

      navigate("/competitions");
    } catch (submitError: any) {
      setError(
        submitError.response?.data?.message ||
          (isEditMode
            ? t("failedUpdateCompetition")
            : t("failedCreateCompetition")),
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="discussion-card text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="discussion-card start-discussion-page">
      <h2 className="mb-1">
        {isEditMode ? t("editCompetition") : t("startNewCompetition")}
      </h2>
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
          <div className="editor-wrap">
            <EditorToolbar
              editor={editor}
              onSetLink={handleSetLink}
              onRemoveLink={handleRemoveLink}
              onEmoji={handleEmoji}
            />
            <div className="editor-body">
              <EditorContent editor={editor} />
            </div>
          </div>
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
              setRemoveExistingImage(false);
            }}
            onError={setError}
          />
        )}

        {isEditMode && existingImage && mediaKind === "image" && !image ? (
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                setRemoveExistingImage(true);
                setExistingImage("");
              }}
            >
              Remove image
            </button>
          </div>
        ) : null}

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() =>
              navigate(isEditMode && id ? `/competitions/${id}` : "/competitions")
            }
          >
            {t("cancel")}
          </button>
          <button type="submit" className="btn btn-brand" disabled={loading}>
            {loading
              ? isEditMode
                ? t("saving")
                : t("starting")
              : isEditMode
                ? t("saveChanges")
                : t("startCompetition")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartCompetition;
