import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import axios from "axios";

import { API_URL, SERVER_URL } from "../../../core/config/env";
import { useLanguage } from "../../../core/context/LanguageContext";
import { downloadDiscussionPdf } from "./downloadDiscussionPdf";
import TranslatedContent from "../../../core/i18n/TranslatedContent";

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
  video?: string;
  createdAt?: string;
  commentCount?: number;
}

interface DiscussionOutletContext {
  searchKeyword?: string;
}

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

const htmlToSearchText = (value?: string) =>
  (value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const Discussion: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outletContext = useOutletContext<DiscussionOutletContext | undefined>();
  const { t } = useLanguage();

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

  const [downloadingPdfId, setDownloadingPdfId] = useState<string>("");

  const searchKeyword = (
    outletContext?.searchKeyword ??
    searchParams.get("q") ??
    ""
  ).trim();

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

        setError(t("failedLoadDiscussions"));
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

        setCategoryError(t("failedLoadCategories"));
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ==========================================
  // FILTER DISCUSSIONS
  // ==========================================

  const filteredDiscussions = discussions.filter((discussion) => {
    const matchesCategory =
      selectedCategory === "all" ||
      discussion.category?._id === selectedCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!searchKeyword) {
      return true;
    }

    const needle = searchKeyword.toLowerCase();
    const haystack = [
      discussion.title,
      htmlToSearchText(discussion.description),
      discussion.category?.name,
      discussion.createdBy?.name,
      discussion.createdBy?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });

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

  const handleDownloadPdf = async (discussion: DiscussionItem) => {
    if (downloadingPdfId) {
      return;
    }

    try {
      setDownloadingPdfId(discussion._id);
      setError("");

      const response = await axios.get(
        `${API_URL}/comments/discussion/${discussion._id}`,
      );

      const comments = Array.isArray(response.data.data)
        ? response.data.data
        : [];

      await downloadDiscussionPdf({
        title: discussion.title,
        description: discussion.description,
        categoryName: discussion.category?.name,
        authorName:
          discussion.createdBy?.name || discussion.createdBy?.email || "User",
        createdAt: discussion.createdAt,
        comments,
      });
    } catch (downloadError) {
      console.error("Failed to download discussion PDF:", downloadError);
      setError(t("pdfFailed"));
    } finally {
      setDownloadingPdfId("");
    }
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
          <h2 className="mb-1">
            {searchKeyword
              ? t("searchResultsFor", { query: searchKeyword })
              : t("latestDiscussions")}
          </h2>

          <p className="text-muted mb-0">
            {searchKeyword
              ? filteredDiscussions.length === 1
                ? t("discussionFound", { count: filteredDiscussions.length })
                : t("discussionsFound", { count: filteredDiscussions.length })
              : t("exploreDiscussions")}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCreateDiscussion}
        >
          + {t("startDiscussion")}
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
          {t("all")}
        </button>

        {/* CATEGORY LOADING */}

        {categoryLoading && (
          <span className="text-muted ms-2">{t("loadingCategories")}</span>
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
              <TranslatedContent text={category.name} />
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

            <p className="text-muted mt-3">{t("loadingDiscussions")}</p>
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
                t("user");

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
                          {discussion.video ? (
                            <video
                              src={`${SERVER_URL}${discussion.video}`}
                              muted
                              preload="metadata"
                            />
                          ) : discussion.image ? (
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

                        <TranslatedContent
                          as="h2"
                          className="card-title mb-1"
                          text={discussion.title}
                        />

                        <TranslatedContent
                          as="div"
                          className="card-desc mb-2"
                          html
                          text={discussion.description}
                          style={{
                            color: "#374151",
                            fontSize: ".95rem",
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
                            {discussion.category?.name ? (
                              <TranslatedContent text={discussion.category.name} />
                            ) : (
                              t("general")
                            )}
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
                            <i className="bi bi-chat-square-text me-1"></i>
                            {discussion.commentCount ?? 0}
                          </span>

                          {/* BOOKMARK */}

                          <button
                            type="button"
                            className="bookmark-btn"
                            aria-label={t("bookmark")}
                          >
                            <i className="bi bi-bookmark"></i>
                          </button>
                        </div>

                        {/* =====================
                                VIEW DISCUSSION
                            ===================== */}

                        <div className="d-flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            className="btn btn-outline-primary align-self-start"
                            onClick={() => handleViewDiscussion(discussion._id)}
                          >
                            {t("viewDiscussion")}
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-primary align-self-start"
                            disabled={downloadingPdfId === discussion._id}
                            onClick={() => handleDownloadPdf(discussion)}
                          >
                            {downloadingPdfId === discussion._id
                              ? t("preparingPdf")
                              : t("downloadPdf")}
                          </button>
                        </div>
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
            <h5>{t("noDiscussions")}</h5>

            <p className="text-muted">
              {searchKeyword
                ? t("noSearchMatches")
                : selectedCategory === "all"
                  ? t("beFirst")
                  : t("noCategoryDiscussions")}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateDiscussion}
            >
              {t("startDiscussion")}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Discussion;
