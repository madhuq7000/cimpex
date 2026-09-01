import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DOMPurify from "dompurify";

// ==========================================
// CATEGORY
// ==========================================

interface Category {
  _id: string;
  name: string;
  description?: string;
}

// ==========================================
// DISCUSSION
// ==========================================

interface DiscussionItem {
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
// SERVER
// ==========================================

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "https://www.vaadsamvaad.com";

const API_URL = `${SERVER_URL}/api`;

// ==========================================
// DEFAULT PROFILE IMAGE
// ==========================================

const DEFAULT_PROFILE_IMAGE = `${SERVER_URL}/uploads/profiles/default-profile.png`;

// ==========================================
// GET PROFILE IMAGE URL
// ==========================================

const getProfileImageUrl = (profileImage?: string) => {
  // No profile image
  if (
    !profileImage ||
    profileImage.trim() === "" ||
    profileImage === "default-profile.png"
  ) {
    return DEFAULT_PROFILE_IMAGE;
  }

  // Complete URL
  if (
    profileImage.startsWith("http://") ||
    profileImage.startsWith("https://")
  ) {
    return profileImage;
  }

  // Example:
  // /uploads/profiles/profile-123.jpg
  if (profileImage.startsWith("/uploads/")) {
    return `${SERVER_URL}${profileImage}`;
  }

  // Example:
  // uploads/profiles/profile-123.jpg
  if (profileImage.startsWith("uploads/")) {
    return `${SERVER_URL}/${profileImage}`;
  }

  // Filename only
  // Example:
  // profile-123.jpg
  return `${SERVER_URL}/uploads/profiles/${profileImage}`;
};

// ==========================================
// DISCUSSION COMPONENT
// ==========================================

const Discussion: React.FC = () => {
  const navigate = useNavigate();

  // ==========================================
  // STATES
  // ==========================================

  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [loading, setLoading] = useState<boolean>(true);

  const [categoryLoading, setCategoryLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>("");

  const [categoryError, setCategoryError] = useState<string>("");

  // ==========================================
  // PROFILE IMAGE ERROR
  // ==========================================

  const handleProfileImageError = (
    e: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    // Prevent endless error loop
    e.currentTarget.onerror = null;

    // Show default image
    e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
  };

  // ==========================================
  // GET DISCUSSIONS
  // ==========================================

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        setLoading(true);

        setError("");

        const response = await axios.get(`${API_URL}/discussions`);

        console.log("Discussion API response:", response.data);

        setDiscussions(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch discussions:", error);

        setError("Failed to load discussions.");
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussions();
  }, []);

  // ==========================================
  // GET CATEGORIES
  // ==========================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);

        setCategoryError("");

        const response = await axios.get(`${API_URL}/categories`);

        console.log("Category API response:", response.data);

        setCategories(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);

        setCategoryError("Failed to load categories.");
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ==========================================
  // FILTER DISCUSSIONS
  // ==========================================

  const filteredDiscussions =
    selectedCategory === "all"
      ? discussions
      : discussions.filter(
          (discussion) => discussion.category?._id === selectedCategory,
        );

  // ==========================================
  // CATEGORY CLICK
  // ==========================================

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // ==========================================
  // VIEW DISCUSSION
  // ==========================================

  const handleViewDiscussion = (discussionId: string) => {
    navigate(`/discussion/${discussionId}`);
  };

  // ==========================================
  // CREATE DISCUSSION
  // ==========================================

  const handleCreateDiscussion = () => {
    navigate("/start-discussion");
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <>
      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Latest Discussions</h2>

          <p className="text-muted mb-0">
            Explore and participate in interesting discussions.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCreateDiscussion}
        >
          + Start Discussion
        </button>
      </div>

      {/* ======================================
          CATEGORY FILTERS
      ====================================== */}

      <div className="filters">
        {/* ALL */}

        <button
          type="button"
          className={`chip ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => handleCategoryClick("all")}
        >
          All
        </button>

        {/* CATEGORY LOADING */}

        {categoryLoading && (
          <span className="text-muted ms-2">Loading categories...</span>
        )}

        {/* CATEGORY ERROR */}

        {!categoryLoading && categoryError && (
          <span className="text-danger ms-2">{categoryError}</span>
        )}

        {/* DYNAMIC CATEGORIES */}

        {!categoryLoading &&
          !categoryError &&
          categories.map((category) => (
            <button
              type="button"
              key={category._id}
              className={`chip ${
                selectedCategory === category._id ? "active" : ""
              }`}
              onClick={() => handleCategoryClick(category._id)}
            >
              {category.name}
            </button>
          ))}
      </div>

      {/* ======================================
          MAIN CONTAINER
      ====================================== */}

      <div className="container mt-4 mb-5">
        {/* ======================================
            DISCUSSION LOADING
        ====================================== */}

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>

            <p className="text-muted mt-3">Loading discussions...</p>
          </div>
        )}

        {/* ======================================
            DISCUSSION ERROR
        ====================================== */}

        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {/* ======================================
            DISCUSSION LIST
        ====================================== */}

        {!loading && !error && filteredDiscussions.length > 0 && (
          <div className="row">
            {filteredDiscussions.map((discussion) => {
              // ==============================
              // AUTHOR NAME
              // ==============================

              const authorName =
                discussion.createdBy?.name ||
                discussion.createdBy?.email ||
                "User";

              // ==============================
              // AUTHOR PROFILE IMAGE
              // ==============================

              const authorProfileImage = getProfileImageUrl(
                discussion.createdBy?.profileImage,
              );

              return (
                <div className="col-12 mb-4" key={discussion._id}>
                  <article className="discussion-card">
                    <div className="row g-3">
                      {/* =====================
                              DISCUSSION IMAGE
                          ===================== */}

                      <div className="col-md-3 col-lg-2">
                        <div className="thumb">
                          {discussion.image ? (
                            <img
                              src={`${SERVER_URL}${discussion.image}`}
                              alt={discussion.title}
                            />
                          ) : (
                            <img
                              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop"
                              alt="Discussion"
                            />
                          )}
                        </div>
                      </div>

                      {/* =====================
                              DISCUSSION CONTENT
                          ===================== */}

                      <div className="col-md-9 col-lg-10 d-flex flex-column">
                        {/* TITLE */}

                        <h2 className="card-title mb-1">{discussion.title}</h2>

                        {/* DESCRIPTION */}

                        <div
                          className="card-desc mb-2"
                          style={{
                            color: "#374151",

                            fontSize: ".95rem",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(discussion.description),
                          }}
                        />

                        {/* =====================
                                AUTHOR / CATEGORY /
                                TIME
                            ===================== */}

                        <div className="d-flex align-items-center gap-2 flex-wrap mb-2 profileImage">
                          {/* AUTHOR IMAGE */}

                          <img
                            src={authorProfileImage}
                            alt={authorName}
                            onError={handleProfileImageError}
                          />

                          {/* AUTHOR NAME */}

                          <span className="author-name">{authorName}</span>

                          {/* CATEGORY */}

                          <span className="tag">
                            {discussion.category?.name || "General"}
                          </span>

                          {/* TIME */}

                          <span className="time-text ms-auto">
                            {discussion.createdAt
                              ? new Date(
                                  discussion.createdAt,
                                ).toLocaleDateString("en-IN")
                              : ""}
                          </span>
                        </div>

                        {/* =====================
                                FOOTER
                            ===================== */}

                        <div className="card-footer-custom">
                          {/* COMMENTS */}

                          <span className="stat">
                            <i className="bi bi-chat-square-text"></i>
                          </span>

                          {/* BOOKMARK */}

                          <button
                            type="button"
                            className="bookmark-btn"
                            aria-label="Bookmark"
                          >
                            <i className="bi bi-bookmark"></i>
                          </button>
                        </div>

                        {/* =====================
                                VIEW DISCUSSION
                            ===================== */}

                        <button
                          type="button"
                          className="btn btn-outline-primary mt-3 align-self-start"
                          onClick={() => handleViewDiscussion(discussion._id)}
                        >
                          View Discussion
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================
            EMPTY STATE
        ====================================== */}

        {!loading && !error && filteredDiscussions.length === 0 && (
          <div className="text-center py-5">
            <h5>No discussions available</h5>

            <p className="text-muted">
              {selectedCategory === "all"
                ? "Be the first person to start a discussion."
                : "There are no discussions in this category yet."}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateDiscussion}
            >
              Start Discussion
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Discussion;
