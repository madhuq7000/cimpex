import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import axios from "axios";

import { API_URL, SERVER_URL } from "../../../core/config/env";
import { useLanguage } from "../../../core/context/LanguageContext";
import {
  getProfileImageUrl,
  handleProfileImageError,
} from "../../../core/utils/profileImage";
import {
  DEFAULT_DISCUSSION_IMAGE,
  getDiscussionImageUrl,
} from "../../../core/utils/mediaDefaults";
import { downloadDiscussionPdf, downloadOriginalDocument } from "./downloadDiscussionPdf";
import TranslatedContent from "../../../core/i18n/TranslatedContent";
import VideoMedia from "../../../sharedComponent/VideoMedia";
import CategoryScroller from "../../../sharedComponent/CategoryScroller";

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
  youtubeUrl?: string;
  document?: string;
  documentName?: string;
  createdAt?: string;
  commentCount?: number;
}

interface DiscussionOutletContext {
  searchKeyword?: string;
}

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

      if (discussion.document) {
        await downloadOriginalDocument(
          `${SERVER_URL}${discussion.document}`,
          discussion.documentName || "document",
        );
        return;
      }

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

        <Link to="/start-discussion" className="start-discussion-link">
          + {t("startDiscussion")}
        </Link>
      </div>

      {/* ======================================
          CATEGORY FILTERS
      ====================================== */}

      <CategoryScroller>
        <button
          type="button"
          className={`chip ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => handleCategoryClick("all")}
        >
          {t("all")}
        </button>

        {categoryLoading && (
          <span className="text-muted ms-2">{t("loadingCategories")}</span>
        )}

        {!categoryLoading && categoryError && (
          <span className="text-danger ms-2">{categoryError}</span>
        )}

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
      </CategoryScroller>

      {/* ======================================
          MAIN CONTAINER
      ====================================== */}

      <div className="mt-4 mb-5">
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
          <div className="row mx-0">
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
                              DISCUSSION IMAGE / VIDEO
                          ===================== */}

                      <div className="col-md-3 col-lg-2">
                        <div className="thumb">
                          {discussion.video || discussion.youtubeUrl ? (
                            <VideoMedia
                              video={discussion.video}
                              youtubeUrl={discussion.youtubeUrl}
                              title={discussion.title}
                            />
                          ) : (
                            <img
                              src={getDiscussionImageUrl(discussion.image)}
                              alt={discussion.title}
                              onError={(event) => {
                                event.currentTarget.src = DEFAULT_DISCUSSION_IMAGE;
                              }}
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
                          <span className="stat">
                            <i className="bi bi-chat-square-text me-1"></i>
                            {discussion.commentCount ?? 0}
                          </span>

                          <div className="card-footer-actions">
                            <button
                              type="button"
                              className="btn btn-outline-primary action-icon-btn"
                              aria-label={t("viewDiscussion")}
                              title={t("viewDiscussion")}
                              onClick={() => handleViewDiscussion(discussion._id)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-primary action-icon-btn"
                              aria-label={
                                downloadingPdfId === discussion._id
                                  ? t("preparingPdf")
                                  : discussion.document
                                    ? t("downloadFile")
                                    : t("downloadPdf")
                              }
                              title={
                                downloadingPdfId === discussion._id
                                  ? t("preparingPdf")
                                  : discussion.document
                                    ? t("downloadFile")
                                    : t("downloadPdf")
                              }
                              disabled={downloadingPdfId === discussion._id}
                              onClick={() => handleDownloadPdf(discussion)}
                            >
                              {downloadingPdfId === discussion._id ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : (
                                <i className="bi bi-download"></i>
                              )}
                            </button>
                          </div>
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

            <Link to="/start-discussion" className="start-discussion-link">
              {t("startDiscussion")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Discussion;
