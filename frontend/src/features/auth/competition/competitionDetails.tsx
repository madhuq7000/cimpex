import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../../../core/context/AuthContext";
import { useLanguage } from "../../../core/context/LanguageContext";
import { API_URL, SERVER_URL } from "../../../core/config/env";
import TranslatedContent from "../../../core/i18n/TranslatedContent";
import { getProfileImageUrl } from "../../../core/utils/profileImage";
import {
  DEFAULT_COMPETITION_IMAGE,
  getCompetitionImageUrl,
} from "../../../core/utils/mediaDefaults";
import VideoMedia from "../../../sharedComponent/VideoMedia";
import ShareMenu from "../../../sharedComponent/ShareMenu";
import VideoSourceFields from "../../../sharedComponent/VideoSourceFields";
import ImageSourceFields from "../../../sharedComponent/ImageSourceFields";
import MediaAttachSelect, {
  type MediaAttachKind,
} from "../../../sharedComponent/MediaAttachSelect";
import { isCompetitionAdminEmail } from "../../../core/utils/superAdmin";
import ConfirmModal from "../../../sharedComponent/ConfirmModal";
import { getYoutubeVideoId } from "../../../core/utils/youtube";

interface CompetitionUser {
  _id?: string;
  name?: string;
  email?: string;
  profileImage?: string;
}

interface CompetitionEntry {
  _id: string;
  stance: "support" | "against";
  title: string;
  article?: string;
  video?: string;
  youtubeUrl?: string;
  image?: string;
  document?: string;
  documentName?: string;
  createdBy?: CompetitionUser;
  createdAt?: string;
}

interface Competition {
  _id: string;
  title: string;
  description?: string;
  video?: string;
  youtubeUrl?: string;
  image?: string;
  createdBy?: CompetitionUser;
  createdAt?: string;
  supportEntries?: CompetitionEntry[];
  againstEntries?: CompetitionEntry[];
  supportCount?: number;
  againstCount?: number;
  commentCount?: number;
}

interface CommentItem {
  _id: string;
  comment: string;
  createdBy?: CompetitionUser;
  createdAt?: string;
}

interface LoggedInUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  profileImage?: string;
}

const formatDate = (value?: string) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CompetitionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const storedUser = localStorage.getItem("user");
  let loggedInUser: LoggedInUser | null = null;

  try {
    loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    loggedInUser = null;
  }

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stance, setStance] = useState<"support" | "against">("support");
  const [entryTitle, setEntryTitle] = useState("");
  const [article, setArticle] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [mediaKind, setMediaKind] = useState<MediaAttachKind>("");
  const [entryError, setEntryError] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState("");
  const [existingEntryMedia, setExistingEntryMedia] = useState<{
    video?: string;
    youtubeUrl?: string;
    image?: string;
    document?: string;
    documentName?: string;
  }>({});

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [sortComments, setSortComments] = useState("Latest");
  const [deletingCompetition, setDeletingCompetition] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState("");
  const [deletingEntryId, setDeletingEntryId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<
    | null
    | { type: "competition" }
    | { type: "comment"; id: string }
    | { type: "entry"; id: string }
  >(null);

  const currentUserId = String(loggedInUser?.id || loggedInUser?._id || "");
  const isCompetitionAdmin = isCompetitionAdminEmail(loggedInUser?.email);
  const isCompetitionOwner = Boolean(
    currentUserId &&
      competition?.createdBy?._id &&
      String(competition.createdBy._id) === currentUserId,
  );
  const canManageCompetition = isCompetitionOwner || isCompetitionAdmin;
  const canModerateComments = isCompetitionOwner || isCompetitionAdmin;

  const canManageEntry = (entry: CompetitionEntry) => {
    if (!isAuthenticated || !currentUserId) {
      return false;
    }

    const isEntryOwner = Boolean(
      entry.createdBy?._id && String(entry.createdBy._id) === currentUserId,
    );

    return isEntryOwner || isCompetitionAdmin || isCompetitionOwner;
  };

  const resetEntryForm = () => {
    setEditingEntryId("");
    setStance("support");
    setEntryTitle("");
    setArticle("");
    setVideo(null);
    setImage(null);
    setDocumentFile(null);
    setYoutubeUrl("");
    setVideoPreview("");
    setMediaKind("");
    setExistingEntryMedia({});
    setEntryError("");
  };

  const startEditEntry = (entry: CompetitionEntry) => {
    setEditingEntryId(entry._id);
    setStance(entry.stance);
    setEntryTitle(entry.title || "");
    setArticle(entry.article || "");
    setVideo(null);
    setImage(null);
    setDocumentFile(null);
    setYoutubeUrl(entry.youtubeUrl || "");
    setExistingEntryMedia({
      video: entry.video || "",
      youtubeUrl: entry.youtubeUrl || "",
      image: entry.image || "",
      document: entry.document || "",
      documentName: entry.documentName || "",
    });

    if (entry.video || entry.youtubeUrl) {
      setMediaKind("video");
    } else if (entry.image) {
      setMediaKind("image");
    } else if (entry.document) {
      setMediaKind("document");
    } else {
      setMediaKind("");
    }

    setEntryError("");
    window.setTimeout(() => {
      document
        .getElementById("competition-entry-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  useEffect(() => {
    if (!video) {
      setVideoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(video);
    setVideoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [video]);

  const loadCompetition = async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/competitions/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setCompetition(response.data.data || null);
    } catch (loadError: any) {
      setError(loadError.response?.data?.message || t("failedLoadCompetition"));
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) {
      return;
    }

    try {
      setCommentsLoading(true);
      setCommentError("");

      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/competitions/${id}/comments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setComments(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (loadError: any) {
      setComments([]);
      setCommentError(
        loadError.response?.data?.message || t("failedLoadComments"),
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadCompetition();
    loadComments();
  }, [id]);

  const sortedComments = useMemo(() => {
    const next = [...comments];

    next.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortComments === "Oldest" ? aTime - bTime : bTime - aTime;
    });

    return next;
  }, [comments, sortComments]);

  const handleVideoFileChange = (file: File | null) => {
    setVideo(file);
    setEntryError("");

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
    setEntryError("");

    if (nextKind !== "image") {
      setImage(null);
    }

    if (nextKind !== "video") {
      setVideo(null);
      setYoutubeUrl("");
    }

    if (nextKind !== "document") {
      setDocumentFile(null);
    }
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const name = file.name.toLowerCase();
    const isAllowed =
      name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");

    if (!isAllowed) {
      setEntryError(t("onlyDocumentTypes"));
      return;
    }

    setDocumentFile(file);
    setEntryError("");
  };

  const handleSubmitEntry = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!entryTitle.trim()) {
      setEntryError(t("entryTitleRequired"));
      return;
    }

    const hasExistingMedia =
      Boolean(editingEntryId) &&
      ((mediaKind === "video" &&
        (existingEntryMedia.video || existingEntryMedia.youtubeUrl)) ||
        (mediaKind === "image" && existingEntryMedia.image) ||
        (mediaKind === "document" && existingEntryMedia.document));

    if (
      !article.trim() &&
      !(mediaKind === "video" && (video || youtubeUrl.trim() || hasExistingMedia)) &&
      !(mediaKind === "document" && (documentFile || hasExistingMedia)) &&
      !(mediaKind === "image" && (image || hasExistingMedia))
    ) {
      setEntryError(t("entryContentRequired"));
      return;
    }

    if (
      mediaKind === "video" &&
      youtubeUrl.trim() &&
      !getYoutubeVideoId(youtubeUrl)
    ) {
      setEntryError(t("invalidYoutubeLink"));
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setEntryLoading(true);
      setEntryError("");

      const formData = new FormData();
      formData.append("stance", stance);
      formData.append("title", entryTitle.trim());
      formData.append("article", article.trim());
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

      if (mediaKind === "document" && documentFile) {
        formData.append("document", documentFile);
      }

      if (editingEntryId) {
        if (mediaKind !== "image" && existingEntryMedia.image) {
          formData.append("removeImage", "true");
        }
        if (mediaKind !== "video" && existingEntryMedia.video) {
          formData.append("removeVideo", "true");
        }
        if (mediaKind !== "video" && existingEntryMedia.youtubeUrl) {
          formData.append("removeYoutube", "true");
        }
        if (mediaKind !== "document" && existingEntryMedia.document) {
          formData.append("removeDocument", "true");
        }

        await axios.put(
          `${API_URL}/competitions/${id}/entries/${editingEntryId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } else {
        await axios.post(`${API_URL}/competitions/${id}/entries`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      resetEntryForm();
      await loadCompetition();
    } catch (submitError: any) {
      setEntryError(
        submitError.response?.data?.message ||
          (editingEntryId ? t("failedUpdateEntry") : t("failedSubmitEntry")),
      );
    } finally {
      setEntryLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setCommentLoading(true);
      setCommentError("");

      await axios.post(
        `${API_URL}/competitions/${id}/comments`,
        { comment: commentText.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCommentText("");
      await loadComments();
    } catch (postError: any) {
      setCommentError(postError.response?.data?.message || t("failedAddComment"));
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteCompetition = async () => {
    if (!competition || deletingCompetition) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setDeletingCompetition(true);
      setError("");

      await axios.delete(`${API_URL}/competitions/${competition._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDeleteTarget(null);
      navigate("/competitions", { replace: true });
    } catch (deleteError: any) {
      setError(
        deleteError.response?.data?.message || t("failedDeleteCompetition"),
      );
      setDeleteTarget(null);
    } finally {
      setDeletingCompetition(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id || !commentId || deletingCommentId) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setDeletingCommentId(commentId);
      setCommentError("");

      await axios.delete(
        `${API_URL}/competitions/${id}/comments/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setComments((prev) => prev.filter((item) => item._id !== commentId));
      setDeleteTarget(null);
    } catch (deleteError: any) {
      setCommentError(
        deleteError.response?.data?.message || t("failedDeleteComment"),
      );
      setDeleteTarget(null);
    } finally {
      setDeletingCommentId("");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!id || !entryId || deletingEntryId) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setDeletingEntryId(entryId);
      setError("");

      await axios.delete(`${API_URL}/competitions/${id}/entries/${entryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (editingEntryId === entryId) {
        resetEntryForm();
      }

      setDeleteTarget(null);
      await loadCompetition();
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.message || t("failedDeleteEntry"));
      setDeleteTarget(null);
    } finally {
      setDeletingEntryId("");
    }
  };

  const renderEntry = (entry: CompetitionEntry) => {
    const authorName =
      entry.createdBy?.name || entry.createdBy?.email || t("user");
    const showManageActions = canManageEntry(entry);

    return (
      <article className="discussion-card mb-3" key={entry._id}>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="thumb">
              {entry.video || entry.youtubeUrl ? (
                <VideoMedia
                  video={entry.video}
                  youtubeUrl={entry.youtubeUrl}
                  title={entry.title}
                />
              ) : entry.image ? (
                <img
                  src={`${SERVER_URL}${entry.image}`}
                  alt={entry.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    minHeight: "110px",
                  }}
                />
              ) : (
                <div className="competition-thumb-inner">
                  <i
                    className={`bi ${
                      entry.document ? "bi-file-earmark-pdf" : "bi-journal-text"
                    }`}
                  ></i>
                </div>
              )}
            </div>
          </div>

          <div className="col-md-8">
            <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
              <span
                className={`stance-badge ${
                  entry.stance === "support" ? "support" : "against"
                }`}
              >
                {entry.stance === "support" ? t("inSupport") : t("against")}
              </span>

              {showManageActions ? (
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => startEditEntry(entry)}
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled={deletingEntryId === entry._id}
                    onClick={() =>
                      setDeleteTarget({ type: "entry", id: entry._id })
                    }
                  >
                    {deletingEntryId === entry._id
                      ? t("deleting")
                      : t("delete")}
                  </button>
                </div>
              ) : null}
            </div>

            <TranslatedContent as="h3" className="card-title mt-2" text={entry.title} />

            {entry.article ? (
              <TranslatedContent
                as="p"
                className="card-desc mb-2"
                text={entry.article}
              />
            ) : null}

            {entry.document ? (
              <a
                className="btn btn-sm btn-outline-primary mb-2"
                href={`${SERVER_URL}${entry.document}`}
                target="_blank"
                rel="noreferrer"
              >
                <i className="bi bi-download me-1"></i>
                {entry.documentName || t("downloadDocument")}
              </a>
            ) : null}

            <div className="d-flex align-items-center gap-2 flex-wrap profileImage">
              <img
                src={getProfileImageUrl(entry.createdBy?.profileImage)}
                alt={authorName}
              />
              <div className="d-flex flex-column min-w-0">
                <span className="author-name">{authorName}</span>
                {entry.createdBy?.email ? (
                  <span
                    className="time-text"
                    style={{ fontSize: "0.8rem", wordBreak: "break-all" }}
                  >
                    {entry.createdBy.email}
                  </span>
                ) : null}
              </div>
              <span className="time-text ms-auto">{formatDate(entry.createdAt)}</span>
            </div>
          </div>
        </div>
      </article>
    );
  };

  if (loading) {
    return <div className="text-center py-5 text-muted">{t("loadingCompetition")}</div>;
  }

  if (error || !competition) {
    return (
      <div>
        <Link to="/competitions" className="back-link">
          <i className="bi bi-arrow-left"></i>
          {t("backButton")}
        </Link>
        <div className="alert alert-danger">{error || t("competitionNotFound")}</div>
      </div>
    );
  }

  const authorName =
    competition.createdBy?.name || competition.createdBy?.email || t("user");

  return (
    <div>
      <Link to="/competitions" className="back-link">
        <i className="bi bi-arrow-left"></i>
        {t("backButton")}
      </Link>

      <div className="mb-3 small text-muted">
        <Link to="/discussion">{t("home")}</Link>
        {" > "}
        <Link to="/competitions">{t("competitions")}</Link>
        {" > "}
        <span>{competition.title}</span>
      </div>

      <div className="discussion-card mb-4">
        <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
          <span className="tag d-inline-block">{t("competition")}</span>
          <div className="d-flex gap-2 flex-wrap">
            {!isAuthenticated ? (
              <button
                type="button"
                className="btn btn-brand"
                onClick={() =>
                  navigate(
                    `/login?mode=participate&next=${encodeURIComponent(
                      `/competitions/${competition._id}`,
                    )}`,
                  )
                }
              >
                {t("participate")}
              </button>
            ) : null}
            {isAuthenticated && canManageCompetition ? (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() =>
                    navigate(`/competitions/edit/${competition._id}`)
                  }
                >
                  {t("editCompetition")}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={deletingCompetition}
                  onClick={() => setDeleteTarget({ type: "competition" })}
                >
                  {deletingCompetition ? t("deleting") : t("deleteCompetition")}
                </button>
              </>
            ) : null}
          </div>
        </div>
        <TranslatedContent as="h1" className="mb-2" text={competition.title} />

        {competition.description ? (
          <TranslatedContent
            as="div"
            className="mb-3 discussion-description"
            html
            text={competition.description}
            style={{ color: "#374151" }}
          />
        ) : null}

        {(competition.video || competition.youtubeUrl) && (
          <div className="mb-3">
            <VideoMedia
              video={competition.video}
              youtubeUrl={competition.youtubeUrl}
              title={competition.title}
              variant="wide"
            />
          </div>
        )}

        {!(competition.video || competition.youtubeUrl) || competition.image ? (
          <div className="mb-3">
            <img
              src={getCompetitionImageUrl(competition.image)}
              alt={competition.title}
              onError={(event) => {
                event.currentTarget.src = DEFAULT_COMPETITION_IMAGE;
              }}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: "10px",
              }}
            />
          </div>
        ) : null}

        <div className="d-flex align-items-center gap-2 flex-wrap profileImage">
          <img
            src={getProfileImageUrl(competition.createdBy?.profileImage)}
            alt={authorName}
          />
          <span className="author-name">{authorName}</span>
          <span className="time-text">{formatDate(competition.createdAt)}</span>
          <span className="stat-pill">
            {t("inSupport")} {competition.supportCount ?? 0} · {t("against")}{" "}
            {competition.againstCount ?? 0}
          </span>
          <ShareMenu
            path={`/competitions/${competition._id}`}
            title={competition.title}
          />
        </div>
      </div>

      <div className="discussion-card mb-4" id="competition-entry-form">
        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
          <h2 className="section-title mb-0">
            {editingEntryId ? t("editEntry") : t("submitYourEntry")}
          </h2>
          {editingEntryId ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={resetEntryForm}
            >
              {t("cancelEdit")}
            </button>
          ) : null}
        </div>

        {isAuthenticated ? (
          <form onSubmit={handleSubmitEntry}>
            {entryError && <div className="alert alert-danger">{entryError}</div>}

            <div className="mb-3">
              <label className="field-label mb-2">{t("yourStance")}</label>
              <div className="d-flex gap-3">
                <label className="d-flex align-items-center gap-2">
                  <input
                    type="radio"
                    name="stance"
                    checked={stance === "support"}
                    onChange={() => setStance("support")}
                  />
                  {t("inSupport")}
                </label>
                <label className="d-flex align-items-center gap-2">
                  <input
                    type="radio"
                    name="stance"
                    checked={stance === "against"}
                    onChange={() => setStance("against")}
                  />
                  {t("against")}
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label className="field-label mb-2">{t("entryTitle")}</label>
              <input
                type="text"
                className="form-control"
                value={entryTitle}
                onChange={(event) => setEntryTitle(event.target.value)}
                placeholder={t("entryTitlePlaceholder")}
              />
            </div>

            <div className="mb-3">
              <label className="field-label mb-2">
                {t("writeArticle")} <span className="optional">{t("optional")}</span>
              </label>
              <textarea
                className="form-control"
                rows={6}
                value={article}
                onChange={(event) => setArticle(event.target.value)}
                placeholder={t("articlePlaceholder")}
              />
            </div>

            <MediaAttachSelect
              value={mediaKind}
              options={["image", "document", "video"]}
              onChange={handleMediaKindChange}
            />

            {mediaKind === "video" && (
              <VideoSourceFields
                inputId="competitionVideoInput"
                video={video}
                videoPreview={videoPreview}
                youtubeUrl={youtubeUrl}
                previewTitle={entryTitle}
                onVideoChange={handleVideoFileChange}
                onYoutubeChange={handleYoutubeUrlChange}
                onError={setEntryError}
              />
            )}

            {mediaKind === "image" && (
              <ImageSourceFields
                inputId="competitionImageInput"
                image={image}
                onImageChange={(file) => {
                  setEntryError("");
                  setImage(file);
                }}
                onError={setEntryError}
              />
            )}

            {mediaKind === "document" && (
              <div className="mb-3">
                <label className="field-label mb-2">
                  {t("uploadDocument")}{" "}
                  <span className="optional">{t("optional")}</span>
                </label>
                <label htmlFor="competitionDocumentInput" className="upload-box">
                  <i className="bi bi-file-earmark-text d-block mb-2"></i>
                  <div>
                    {documentFile
                      ? documentFile.name
                      : t("dropCompetitionDocument")}
                  </div>
                  <div className="upload-hint mt-1">
                    {t("competitionDocumentHint")}
                  </div>
                  <input
                    id="competitionDocumentInput"
                    type="file"
                    className="d-none"
                    accept=".pdf,.doc,.docx,application/pdf"
                    onChange={handleDocumentChange}
                  />
                </label>
              </div>
            )}

            <button type="submit" className="btn btn-brand" disabled={entryLoading}>
              {entryLoading
                ? editingEntryId
                  ? t("saving")
                  : t("submitting")
                : editingEntryId
                  ? t("updateEntry")
                  : t("submitEntry")}
            </button>
          </form>
        ) : (
          <div className="text-center py-3">
            <p className="text-muted mb-3">{t("participateToSubmitEntry")}</p>
            <button
              type="button"
              className="btn btn-brand"
              onClick={() =>
                navigate(
                  `/login?mode=participate&next=${encodeURIComponent(
                    `/competitions/${competition._id}`,
                  )}`,
                )
              }
            >
              {t("participate")}
            </button>
          </div>
        )}
      </div>

      <div className="row">
        <div className="col-lg-6">
          <h3 className="section-title mb-3">
            {t("inSupport")} ({competition.supportCount ?? 0})
          </h3>
          {(competition.supportEntries || []).length === 0 ? (
            <p className="text-muted">{t("noSupportEntries")}</p>
          ) : (
            (competition.supportEntries || []).map(renderEntry)
          )}
        </div>

        <div className="col-lg-6">
          <h3 className="section-title mb-3">
            {t("against")} ({competition.againstCount ?? 0})
          </h3>
          {(competition.againstEntries || []).length === 0 ? (
            <p className="text-muted">{t("noAgainstEntries")}</p>
          ) : (
            (competition.againstEntries || []).map(renderEntry)
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="opinions-count">
            {t("commentsCount", { count: comments.length })}
          </span>

          <div className="d-flex align-items-center gap-1">
            <span className="text-muted small">{t("sortBy")}</span>
            <select
              className="sort-select"
              value={sortComments}
              onChange={(event) => setSortComments(event.target.value)}
            >
              <option value="Latest">{t("latest")}</option>
              <option value="Oldest">{t("oldest")}</option>
            </select>
          </div>
        </div>

        {commentError && <div className="alert alert-danger py-2">{commentError}</div>}

        {commentsLoading ? (
          <div className="text-center py-4 text-muted">{t("loadingComments")}</div>
        ) : sortedComments.length === 0 ? (
          <div className="text-muted py-4 text-center">{t("noComments")}</div>
        ) : (
          sortedComments.map((comment) => {
            const commentUserName =
              comment.createdBy?.name || comment.createdBy?.email || t("user");

            return (
              <div className="comment-thread mb-3" key={comment._id}>
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <img
                      src={getProfileImageUrl(comment.createdBy?.profileImage)}
                      className="avatar-sm avatar"
                      alt={commentUserName}
                    />
                    <div>
                      <span className="opinion-name">{commentUserName}</span>
                      {comment.createdAt && (
                        <div className="opinion-time">
                          {formatDate(comment.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAuthenticated &&
                    (canModerateComments ||
                      String(comment.createdBy?._id || "") ===
                        currentUserId) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={deletingCommentId === comment._id}
                        onClick={() =>
                          setDeleteTarget({ type: "comment", id: comment._id })
                        }
                      >
                        {deletingCommentId === comment._id
                          ? t("deleting")
                          : t("delete")}
                      </button>
                    )}
                </div>
                <p className="opinion-body mb-1">
                  <TranslatedContent text={comment.comment} />
                </p>
              </div>
            );
          })
        )}

        {isAuthenticated ? (
          <div className="composer-row d-flex align-items-center gap-2 mt-4">
            <img
              src={getProfileImageUrl(loggedInUser?.profileImage)}
              className="avatar"
              alt={loggedInUser?.name || t("user")}
            />
            <input
              type="text"
              className="form-control"
              placeholder={t("writeComment")}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handlePostComment();
                }
              }}
              disabled={commentLoading}
            />
            <button
              type="button"
              className="btn btn-brand"
              onClick={handlePostComment}
              disabled={commentLoading || !commentText.trim()}
            >
              {commentLoading ? t("posting") : t("comment")}
            </button>
          </div>
        ) : (
          <div className="alert alert-light border mt-4 text-center">
            <i className="bi bi-lock-fill me-2"></i>
            {t("pleaseLoginToComment")}{" "}
            <Link to="/login" className="fw-semibold">
              {t("login")}
            </Link>
          </div>
        )}
      </div>

      <ConfirmModal
        show={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === "comment"
            ? t("deleteComment")
            : deleteTarget?.type === "entry"
              ? t("deleteEntry")
              : t("deleteCompetition")
        }
        message={
          deleteTarget?.type === "comment"
            ? t("deleteCommentConfirm")
            : deleteTarget?.type === "entry"
              ? t("deleteEntryConfirm")
              : t("deleteCompetitionConfirm")
        }
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        confirming={
          deleteTarget?.type === "competition"
            ? deletingCompetition
            : deleteTarget?.type === "entry"
              ? Boolean(deletingEntryId)
              : Boolean(deletingCommentId)
        }
        onCancel={() => {
          if (!deletingCompetition && !deletingCommentId && !deletingEntryId) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          if (deleteTarget?.type === "competition") {
            void handleDeleteCompetition();
          } else if (deleteTarget?.type === "comment") {
            void handleDeleteComment(deleteTarget.id);
          } else if (deleteTarget?.type === "entry") {
            void handleDeleteEntry(deleteTarget.id);
          }
        }}
      />
    </div>
  );
};

export default CompetitionDetails;
