import React, { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import axios from "axios";
import DOMPurify from "dompurify";

import { useAuth } from "../../../core/context/AuthContext";

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

// ==========================================
// SERVER
// ==========================================

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const API_URL = `${SERVER_URL}/api`;

// ==========================================
// PROFILE IMAGE HELPER
// ==========================================

const getProfileImageUrl = (profileImage?: string) => {
  if (!profileImage) {
    return `${SERVER_URL}/uploads/profiles/default-profile.png`;
  }

  // Complete URL
  if (
    profileImage.startsWith("http://") ||
    profileImage.startsWith("https://")
  ) {
    return profileImage;
  }

  // Already contains /uploads/
  if (profileImage.startsWith("/uploads/")) {
    return `${SERVER_URL}${profileImage}`;
  }

  // Filename only
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

        <p className="text-muted mt-3">Loading discussion...</p>
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
          Back to Discussions
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
          Back to Discussions
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
          Home
        </a>

        <span className="mx-1 text-muted">&gt;</span>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();

            navigate("/discussion");
          }}
        >
          Discussions
        </a>

        <span className="mx-1 text-muted">&gt;</span>

        <span className="current">{discussion.title}</span>
      </div>

      {/* ======================================
          MAIN DISCUSSION CARD
      ====================================== */}

      <div className="discussion-card mb-4">
        {/* CATEGORY */}

        <span className="badge-tech d-inline-block mb-3">
          {discussion.category?.name || "General"}
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
              Edit
            </span>
          </>
        )}

        {/* TITLE */}

        <h1 className="thread-title mb-3">{discussion.title}</h1>

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

          {/* STATS */}

          <div className="d-flex gap-3">
            <span className="stat-pill">
              <i className="bi bi-chat"></i> {comments.length} Comments
            </span>
          </div>
        </div>

        {/* ======================================
            DESCRIPTION
        ====================================== */}

        <div
          className="mb-3 discussion-description"
          style={{
            color: "#374151",

            fontSize: ".95rem",
          }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(discussion.description),
          }}
        />

        {/* ======================================
            DISCUSSION IMAGE
        ====================================== */}

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
        ) : (
          <div className="hero-banner mb-1">
            <div className="glyph">
              <i className="bi bi-chat-square-text"></i>
            </div>
          </div>
        )}
      </div>

      {/* ======================================
          COMMENTS
      ====================================== */}

      <div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="opinions-count">Comments ({comments.length})</span>

          <div className="d-flex align-items-center gap-1">
            <span className="text-muted small">Sort by:</span>

            <select
              className="sort-select"
              value={sortComments}
              onChange={(e) => setSortComments(e.target.value)}
            >
              <option value="Latest">Latest</option>

              <option value="Oldest">Oldest</option>
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

            <span className="ms-2 text-muted">Loading comments...</span>
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="text-muted py-4 text-center">No comments yet.</div>
        ) : (
          sortedComments.map((comment) => {
            const commentUserName =
              comment.createdBy?.name || comment.createdBy?.email || "User";

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

                <p className="opinion-body mb-1">{comment.comment}</p>
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
              placeholder="Write a comment..."
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
              {commentLoading ? "Posting..." : "Comment"}
            </button>
          </div>
        ) : (
          <div className="alert alert-light border mt-4 text-center">
            <i className="bi bi-lock-fill me-2"></i>
            Please{" "}
            <Link to="/login" className="fw-semibold">
              login
            </Link>{" "}
            to write a comment.
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionDetails;
