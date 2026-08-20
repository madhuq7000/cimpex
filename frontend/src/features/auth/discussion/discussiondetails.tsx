import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

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
  };

  image?: string;
  createdAt?: string;
}

interface Opinion {
  id: number;
  name: string;
  image: string;
  time: string;
  content: string;
  likes: number;
  replies: number;
}

interface Comment {
  id: number;
  name: string;
  image: string;
  time?: string;
  content: string;
  likes: number;
  reply?: {
    name: string;
    image: string;
    time: string;
    content: string;
    likes: number;
  };
}

const DiscussionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ==========================================
  // DISCUSSION STATE
  // ==========================================

  const [discussion, setDiscussion] = useState<Discussion | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>("");

  // ==========================================
  // OPINION STATE
  // ==========================================

  const [opinionText, setOpinionText] = useState<string>("");

  const [sortOpinions, setSortOpinions] = useState<string>("Latest");

  // ==========================================
  // COMMENT STATE
  // ==========================================

  const [commentText, setCommentText] = useState<string>("");

  const [sortComments, setSortComments] = useState<string>("Latest");

  // ==========================================
  // TEMPORARY OPINIONS
  // ==========================================

  const [opinions] = useState<Opinion[]>([
    {
      id: 1,
      name: "Rahul Kumar",
      image: "https://i.pravatar.cc/80?img=12",
      time: "2 hours ago",
      content:
        "I don't think AI will completely replace developers. Developers will need to learn how to work with AI and use it as a powerful tool. The demand for skilled developers will still be high.",
      likes: 24,
      replies: 4,
    },
    {
      id: 2,
      name: "Priya Sharma",
      image: "https://i.pravatar.cc/80?img=5",
      time: "1 hour ago",
      content:
        "AI will automate many repetitive tasks, but human creativity, problem-solving and decision-making will remain irreplaceable. Developers who adapt will thrive.",
      likes: 12,
      replies: 2,
    },
  ]);

  // ==========================================
  // TEMPORARY COMMENTS
  // ==========================================

  const [comments] = useState<Comment[]>([
    {
      id: 1,
      name: "Amit Verma",
      image: "https://i.pravatar.cc/80?img=33",
      content:
        "Very interesting perspective! I agree that adaptation is the key.",
      likes: 5,
      reply: {
        name: "Rahul Kumar",
        image: "https://i.pravatar.cc/80?img=12",
        time: "45 minutes ago",
        content:
          "Yes, the future is about collaboration with AI, not competition.",
        likes: 2,
      },
    },
  ]);

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

        const response = await axios.get(
          `http://localhost:3000/api/discussions/${id}`,
        );

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
  // POST OPINION
  // ==========================================

  const handlePostOpinion = () => {
    if (!opinionText.trim()) {
      return;
    }

    console.log("Opinion:", opinionText);

    // API will be added later
    // Example:
    //
    // await axios.post(
    //   `http://localhost:3000/api/discussions/${id}/opinions`,
    //   {
    //     content: opinionText,
    //   }
    // );

    setOpinionText("");
  };

  // ==========================================
  // POST COMMENT
  // ==========================================

  const handlePostComment = () => {
    if (!commentText.trim()) {
      return;
    }

    console.log("Comment:", commentText);

    // API will be added later
    // Example:
    //
    // await axios.post(
    //   `http://localhost:3000/api/discussions/${id}/comments`,
    //   {
    //     content: commentText,
    //   }
    // );

    setCommentText("");
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
  // DATE
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
            navigate("/");
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
        &nbsp;&nbsp;
        <span
          className="badge-tech d-inline-block mb-3"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/discussion/edit/${discussion._id}`)}
        >
          Edit
        </span>
        {/* TITLE */}
        <h1 className="thread-title mb-3">{discussion.title}</h1>
        {/* AUTHOR + DATE + STATS */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          {/* AUTHOR */}

          <div className="d-flex align-items-center gap-2">
            <img
              src="https://i.pravatar.cc/80?img=13"
              className="avatar-sm avatar"
              alt={authorName}
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
              <i className="bi bi-eye"></i> 0 Views
            </span>

            <span className="stat-pill">
              <i className="bi bi-geo-alt"></i> {opinions.length} Opinions
            </span>

            <span className="stat-pill">
              <i className="bi bi-chat"></i> {comments.length} Comments
            </span>
          </div>
        </div>
        {/* DESCRIPTION */}
        <p
          className="mb-3"
          style={{
            color: "#374151",
            fontSize: ".95rem",
          }}
        >
          {discussion.description}
        </p>
        {/* DISCUSSION IMAGE */}
        {discussion.image ? (
          <div className="hero-banner mb-1">
            <img
              src={`http://localhost:3000${discussion.image}`}
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
          SHARE OPINION
      ====================================== */}

      <div className="discussion-card mb-4">
        <h2 className="section-title mb-3">Share your opinion</h2>

        <div className="d-flex align-items-start gap-2">
          <img
            src="https://i.pravatar.cc/80?img=13"
            className="avatar"
            alt="Current User"
          />

          <div className="flex-grow-1 d-flex flex-column flex-sm-row gap-2">
            <textarea
              className="form-control"
              rows={1}
              placeholder="Write your opinion here..."
              value={opinionText}
              onChange={(e) => setOpinionText(e.target.value)}
            />

            <button
              type="button"
              className="btn btn-brand px-4"
              onClick={handlePostOpinion}
            >
              Post Opinion
            </button>
          </div>
        </div>
      </div>

      {/* ======================================
          OPINIONS
      ====================================== */}

      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="opinions-count">Opinions ({opinions.length})</span>

          <div className="d-flex align-items-center gap-1">
            <span className="text-muted small">Sort by:</span>

            <select
              className="sort-select"
              value={sortOpinions}
              onChange={(e) => setSortOpinions(e.target.value)}
            >
              <option value="Latest">Latest</option>

              <option value="Top">Top</option>

              <option value="Oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* OPINION LIST */}

        <div className="d-flex flex-column gap-3">
          {opinions.map((opinion) => (
            <div className="opinion-card" key={opinion.id}>
              <div className="d-flex align-items-center gap-2 mb-1">
                <img
                  src={opinion.image}
                  className="avatar-sm avatar"
                  alt={opinion.name}
                />

                <span className="opinion-name">{opinion.name}</span>

                <span className="opinion-time">&middot; {opinion.time}</span>

                <i className="bi bi-three-dots ms-auto text-muted"></i>
              </div>

              <p className="opinion-body">{opinion.content}</p>

              <div className="opinion-actions">
                <span>
                  <i className="bi bi-hand-thumbs-up"></i>
                  {opinion.likes}
                </span>

                <span>
                  <i className="bi bi-chat"></i>
                  {opinion.replies}
                </span>

                <span>
                  <i className="bi bi-reply"></i>
                  Reply
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* VIEW MORE */}

        <div className="text-center mt-3">
          <button type="button" className="view-more-link btn btn-link">
            View more opinions <i className="bi bi-chevron-down"></i>
          </button>
        </div>
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

              <option value="Top">Top</option>

              <option value="Oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* COMMENT LIST */}

        {comments.map((comment) => (
          <div className="comment-thread mb-3" key={comment.id}>
            {/* COMMENT AUTHOR */}

            <div className="d-flex align-items-center gap-2 mb-1">
              <img
                src={comment.image}
                className="avatar-sm avatar"
                alt={comment.name}
              />

              <span className="opinion-name">{comment.name}</span>

              {comment.time && (
                <span className="opinion-time">{comment.time}</span>
              )}
            </div>

            {/* COMMENT TEXT */}

            <p className="opinion-body mb-1">{comment.content}</p>

            {/* COMMENT ACTIONS */}

            <div className="opinion-actions mb-0">
              <span>
                <i className="bi bi-hand-thumbs-up"></i>
                {comment.likes}
              </span>

              <span>
                <i className="bi bi-reply"></i>
                Reply
              </span>
            </div>

            {/* REPLY */}

            {comment.reply && (
              <div className="comment-reply">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <img
                    src={comment.reply.image}
                    className="avatar-sm avatar"
                    alt={comment.reply.name}
                  />

                  <span className="opinion-name">{comment.reply.name}</span>

                  <span className="opinion-time">{comment.reply.time}</span>
                </div>

                <p className="opinion-body mb-1">{comment.reply.content}</p>

                <div className="opinion-actions mb-0">
                  <span>
                    <i className="bi bi-hand-thumbs-up"></i>
                    {comment.reply.likes}
                  </span>

                  <span>
                    <i className="bi bi-reply"></i>
                    Reply
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ======================================
            COMMENT COMPOSER
        ====================================== */}

        <div className="composer-row d-flex align-items-center gap-2">
          <img
            src="https://i.pravatar.cc/80?img=13"
            className="avatar"
            alt="Current User"
          />

          <input
            type="text"
            className="form-control"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />

          <button
            type="button"
            className="btn btn-brand"
            onClick={handlePostComment}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetails;
