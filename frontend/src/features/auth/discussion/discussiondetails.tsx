import React, { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import axios from "axios";

import { useAuth } from "../../../core/context/AuthContext";
import { useLanguage } from "../../../core/context/LanguageContext";
import { API_URL, SERVER_URL } from "../../../core/config/env";
import { downloadDiscussionPdf } from "./downloadDiscussionPdf";
import TranslatedContent from "../../../core/i18n/TranslatedContent";

// ==========================================
// DISCUSSION
// ==========================================

interface Discussion {
  _id: string;
  title: string;
  description: string;

  category?: {
    _id: string;
    name: string;
  };

  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };

  image?: string;
  video?: string;
  createdAt?: string;
}

// ==========================================
// COMMENT
// ==========================================

interface Comment {
  _id: string;

  discussion?: string;

  comment: string;

  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };

  status?: string;

  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// LOGGED IN USER
// ==========================================

interface LoggedInUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string;
}

const getProfileImageUrl = (profileImage?: string | null) => {
  if (!profileImage || profileImage === "default-profile.png") {
    return `${SERVER_URL}/uploads/profiles/default-profile.png`;
  }

  if (
    profileImage.startsWith("http://") ||
    profileImage.startsWith("https://")
  ) {
    return profileImage;
  }

  if (profileImage.startsWith("/uploads/")) {
    return `${SERVER_URL}${profileImage}`;
  }

  return `${SERVER_URL}/uploads/profiles/${profileImage}`;
};

// ==========================================
// DISCUSSION DETAILS
// ==========================================

const DiscussionDetails: React.FC = () => {
  const { id } = useParams<{
    id: string;
  }>();

  const navigate = useNavigate();

  // ==========================================
  // AUTH
  // ==========================================

  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // ==========================================
  // LOGGED IN USER
  // ==========================================

  const storedUser = localStorage.getItem("user");

  let loggedInUser: LoggedInUser | null = null;

  try {
    loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
  }

  // ==========================================
  // LOGGED IN USER IMAGE
  // ==========================================

  const loggedInUserImage = getProfileImageUrl(loggedInUser?.profileImage);

  // ==========================================
  // IMAGE ERROR FALLBACK
  // ==========================================

  const handleProfileImageError = (
    e: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    const defaultImage = `${SERVER_URL}/uploads/profiles/default-profile.png`;

    if (e.currentTarget.src !== defaultImage) {
      e.currentTarget.src = defaultImage;
    }
  };

  // ==========================================
  // DISCUSSION STATE
  // ==========================================

  const [discussion, setDiscussion] = useState<Discussion | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>("");

  // ==========================================
  // COMMENT STATE
  // ==========================================

  const [comments, setComments] = useState<Comment[]>([]);

  const [commentText, setCommentText] = useState<string>("");

  const [commentLoading, setCommentLoading] = useState<boolean>(false);

  const [commentsLoading, setCommentsLoading] = useState<boolean>(true);

  const [commentError, setCommentError] = useState<string>("");

  const [sortComments, setSortComments] = useState<string>("Latest");

  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  // ==========================================
  // GET DISCUSSION DETAILS
  // ==========================================

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        setLoading(true);

        setError("");

        if (!id) {
          setError("Discussion ID is missing.");

          return;
        }

        const response = await axios.get(`${API_URL}/discussions/${id}`);

        console.log("Discussion details API response:", response.data);

        setDiscussion(response.data.data);
      } catch (error) {
        console.error("Failed to fetch discussion:", error);

        setError("Failed to load discussion.");
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussion();
  }, [id]);

  // ==========================================
  // LOAD COMMENTS
  // PUBLIC
  // ==========================================

  const loadComments = async () => {
    if (!id) {
      return;
    }

    try {
      setCommentsLoading(true);

      setCommentError("");

      const response = await axios.get(`${API_URL}/comments/discussion/${id}`);

      console.log("Comments API response:", response.data);

      setComments(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error: any) {
      console.error("Failed to load comments:", error);

      setComments([]);

      setCommentError(
        error.response?.data?.message || "Failed to load comments.",
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  // ==========================================
  // LOAD COMMENTS ON PAGE LOAD
  // ==========================================

  useEffect(() => {
    loadComments();
  }, [id]);

  // ==========================================
  // POST COMMENT
  // LOGIN REQUIRED
  // ==========================================

  const handlePostComment = async () => {
    // ========================================
    // AUTH CHECK
    // ========================================

    if (!isAuthenticated) {
      navigate("/login");

      return;
    }

    if (!id) {
      return;
    }

    // ========================================
    // VALIDATE
    // ========================================

    if (!commentText.trim()) {
      setCommentError("Please write a comment.");

      return;
    }

    // ========================================
    // TOKEN
    // ========================================

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");

      return;
    }

    try {
      setCommentLoading(true);

      setCommentError("");

      // ========================================
      // POST COMMENT
      // ========================================

      const response = await axios.post(
        `${API_URL}/comments/discussion/${id}`,
        {
          comment: commentText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("COMMENT RESPONSE:", response.data);

      // ========================================
      // CLEAR COMMENT
      // ========================================

      setCommentText("");

      // ========================================
      // REFRESH COMMENTS
      // ========================================

      await loadComments();
    } catch (error: any) {
      console.error("COMMENT ERROR:", error);

      console.error("COMMENT ERROR RESPONSE:", error.response?.data);

      if (error.response?.status === 401) {
        setCommentError("Your session has expired. Please login again.");

        return;
      }

      setCommentError(
        error.response?.data?.message || "Failed to post comment.",
      );
    } finally {
      setCommentLoading(false);
    }
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      handlePostComment();
    }
  };

  const handleDownloadPdf = async () => {
    if (!discussion || downloadingPdf) {
      return;
    }

    try {
      setDownloadingPdf(true);

      await downloadDiscussionPdf({
        title: discussion.title,
        description: discussion.description,
        categoryName: discussion.category?.name,
        authorName:
          discussion.createdBy?.name || discussion.createdBy?.email || t("user"),
        createdAt: discussion.createdAt,
        comments: sortedComments,
      });
    } catch (downloadError) {
      console.error("Failed to download discussion PDF:", downloadError);
      setError("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ==========================================
  // SORT COMMENTS
  // ==========================================

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;

    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (sortComments === "Oldest") {
      return dateA - dateB;
    }

    return dateB - dateA;
  });

  // ==========================================
  // FORMAT COMMENT DATE
  // ==========================================

  const formatCommentDate = (date?: string) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>

        <p className="text-muted mt-3">{t("loadingDiscussion")}</p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/discussion")}
        >
          {t("browseDiscussions")}
        </button>
      </div>
    );
  }

  // ==========================================
  // DISCUSSION NOT FOUND
  // ==========================================

  if (!discussion) {
    return (
      <div className="container text-center py-5">
        <h4>Discussion not found</h4>

        <button
          type="button"
          className="btn btn-primary mt-3"
          onClick={() => navigate("/discussion")}
        >
          {t("browseDiscussions")}
        </button>
      </div>
    );
  }

  // ==========================================
  // AUTHOR
  // ==========================================

  const authorName =
    discussion.createdBy?.name || discussion.createdBy?.email || "Unknown";

  // ==========================================
  // AUTHOR PROFILE IMAGE
  // ==========================================

  const authorProfileImage = getProfileImageUrl(
    discussion.createdBy?.profileImage,
  );

  // ==========================================
  // DISCUSSION DATE
  // ==========================================

  const discussionDate = discussion.createdAt
    ? new Date(discussion.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="container mt-4 mb-5">
      {/* ======================================
          BREADCRUMB
      ====================================== */}

      <div className="breadcrumb-wrap mb-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();

            navigate("/discussion");
          }}
        >
          {t("home")}
        </a>

        <span className="mx-1 text-muted">&gt;</span>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();

            navigate("/discussion");
          }}
        >
          {t("discussions")}
        </a>

        <span className="mx-1 text-muted">&gt;</span>

        <span className="current">
          <TranslatedContent text={discussion.title} />
        </span>
      </div>

      {/* ======================================
          MAIN DISCUSSION CARD
      ====================================== */}

      <div className="discussion-card mb-4">
        {/* CATEGORY */}

        <span className="badge-tech d-inline-block mb-3">
          {discussion.category?.name ? (
            <TranslatedContent text={discussion.category.name} />
          ) : (
            t("general")
          )}
        </span>

        {/* ====================================
            EDIT
        ==================================== */}

        {isAuthenticated && (
          <>
            &nbsp;&nbsp;
            <span
              className="badge-tech d-inline-block mb-3"
              style={{
                cursor: "pointer",
              }}
              onClick={() => navigate(`/discussion/edit/${discussion._id}`)}
            >
              {t("edit")}
            </span>
          </>
        )}

        {/* TITLE */}

        <TranslatedContent
          as="h1"
          className="thread-title mb-3"
          text={discussion.title}
        />

        {/* ======================================
            AUTHOR + DATE + STATS
        ====================================== */}

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          {/* AUTHOR */}

          <div className="d-flex align-items-center gap-2">
            <img
              src={authorProfileImage}
              className="avatar-sm avatar"
              alt={authorName}
              onError={handleProfileImageError}
            />

            <span className="fw-semibold small">{authorName}</span>

            <i className="bi bi-patch-check-fill verified small"></i>

            {discussionDate && (
              <span className="meta-line">
                <span className="meta-sep"></span>

                {discussionDate}

                {discussion.createdAt && (
                  <>
                    <span className="meta-sep"></span>

                    {new Date(discussion.createdAt).toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",

                        minute: "2-digit",
                      },
                    )}
                  </>
                )}
              </span>
            )}
          </div>

          {/* STATS + DOWNLOAD */}

          <div className="d-flex flex-wrap align-items-center gap-3">
            <span className="stat-pill">
              <i className="bi bi-chat"></i> {t("commentsCount", { count: comments.length })}
            </span>

            <a
              href="#"
              className="btn btn-outline-primary"
              onClick={(event) => {
                event.preventDefault();
                handleDownloadPdf();
              }}
            >
              <i className="bi bi-download me-1"></i>
              {downloadingPdf ? t("preparingPdf") : t("downloadPdf")}
            </a>
          </div>
        </div>

        {/* ======================================
            DESCRIPTION
        ====================================== */}

        <TranslatedContent
          as="div"
          className="mb-3 discussion-description"
          html
          text={discussion.description}
          style={{
            color: "#374151",
            fontSize: ".95rem",
          }}
        />

        {/* ======================================
            DISCUSSION MEDIA
        ====================================== */}

        {discussion.video && (
          <div className="mb-3">
            <video
              src={`${SERVER_URL}${discussion.video}`}
              controls
              preload="metadata"
              style={{
                width: "100%",
                maxHeight: "450px",
                borderRadius: "10px",
                background: "#000",
              }}
            >
              {t("videoNotSupported")}
            </video>
          </div>
        )}

        {discussion.image ? (
          <div className="hero-banner mb-1">
            <img
              src={`${SERVER_URL}${discussion.image}`}
              alt={discussion.title}
              style={{
                width: "100%",

                maxHeight: "450px",

                objectFit: "cover",

                borderRadius: "10px",
              }}
            />
          </div>
        ) : !discussion.video ? (
          <div className="hero-banner mb-1">
            <div className="glyph">
              <i className="bi bi-chat-square-text"></i>
            </div>
          </div>
        ) : null}
      </div>

      {/* ======================================
          COMMENTS
      ====================================== */}

      <div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="opinions-count">
            {t("commentsCount", { count: comments.length })}
          </span>

          <div className="d-flex align-items-center gap-1">
            <span className="text-muted small">{t("sortBy")}</span>

            <select
              className="sort-select"
              value={sortComments}
              onChange={(e) => setSortComments(e.target.value)}
            >
              <option value="Latest">{t("latest")}</option>

              <option value="Oldest">{t("oldest")}</option>
            </select>
          </div>
        </div>

        {/* COMMENT ERROR */}

        {commentError && (
          <div className="alert alert-danger py-2">{commentError}</div>
        )}

        {/* ======================================
            COMMENT LIST
        ====================================== */}

        {commentsLoading ? (
          <div className="text-center py-4">
            <div
              className="spinner-border spinner-border-sm"
              role="status"
            ></div>

            <span className="ms-2 text-muted">{t("loadingComments")}</span>
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="text-muted py-4 text-center">{t("noComments")}</div>
        ) : (
          sortedComments.map((comment) => {
            const commentUserName =
              comment.createdBy?.name || comment.createdBy?.email || t("user");

            // ==================================
            // COMMENT USER PROFILE IMAGE
            // ==================================

            const commentProfileImage = getProfileImageUrl(
              comment.createdBy?.profileImage,
            );

            return (
              <div className="comment-thread mb-3" key={comment._id}>
                {/* COMMENT AUTHOR */}

                <div className="d-flex align-items-center gap-2 mb-2">
                  <img
                    src={commentProfileImage}
                    className="avatar-sm avatar"
                    alt={commentUserName}
                    onError={handleProfileImageError}
                  />

                  <div>
                    <span className="opinion-name">{commentUserName}</span>

                    {comment.createdAt && (
                      <div className="opinion-time">
                        {formatCommentDate(comment.createdAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* COMMENT */}

                <p className="opinion-body mb-1">
                  <TranslatedContent text={comment.comment} />
                </p>
              </div>
            );
          })
        )}

        {/* ======================================
            COMMENT COMPOSER
        ====================================== */}

        {isAuthenticated ? (
          <div className="composer-row d-flex align-items-center gap-2 mt-4">
            <img
              src={loggedInUserImage}
              className="avatar"
              alt={loggedInUser?.name || "Current User"}
              onError={handleProfileImageError}
            />

            <input
              type="text"
              className="form-control"
              placeholder={t("writeComment")}
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);

                if (commentError) {
                  setCommentError("");
                }
              }}
              onKeyDown={handleCommentKeyDown}
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
    </div>
  );
};

export default DiscussionDetails;
