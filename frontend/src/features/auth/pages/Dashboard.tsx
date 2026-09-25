import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

import { API_URL } from "../../../core/config/env";
import { useAuth } from "../../../core/context/AuthContext";
import { useLanguage } from "../../../core/context/LanguageContext";
import { isSuperAdminEmail } from "../../../core/utils/superAdmin";
import TranslatedContent from "../../../core/i18n/TranslatedContent";

interface ReviewDiscussion {
  _id: string;
  title: string;
  description?: string;
  category?: { _id?: string; name?: string };
  createdBy?: { name?: string; email?: string };
  createdAt?: string;
  commentCount?: number;
}

interface ReviewCompetition {
  _id: string;
  title: string;
  description?: string;
  createdBy?: { name?: string; email?: string };
  createdAt?: string;
  commentCount?: number;
  entryCount?: number;
}

const toOneLiner = (htmlOrText?: string, maxLength = 140) => {
  const plain = String(htmlOrText || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) {
    return "";
  }

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength - 1).trim()}…`;
};

const formatDate = (value?: string) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const canAccess = isAuthenticated && isSuperAdminEmail(user?.email);

  const [discussions, setDiscussions] = useState<ReviewDiscussion[]>([]);
  const [competitions, setCompetitions] = useState<ReviewCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"discussions" | "competitions">(
    "discussions",
  );

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    const loadReviewItems = async () => {
      try {
        setLoading(true);
        setError("");

        const [discussionRes, competitionRes] = await Promise.all([
          axios.get(`${API_URL}/discussions`),
          axios.get(`${API_URL}/competitions`),
        ]);

        setDiscussions(
          Array.isArray(discussionRes.data?.data) ? discussionRes.data.data : [],
        );
        setCompetitions(
          Array.isArray(competitionRes.data?.data) ? competitionRes.data.data : [],
        );
      } catch (loadError: any) {
        setError(
          loadError.response?.data?.message || t("failedLoadDashboard"),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadReviewItems();
  }, [canAccess, t]);

  const discussionRows = useMemo(
    () =>
      discussions.map((item) => ({
        id: item._id,
        title: item.title,
        category: item.category?.name || t("general"),
        summary:
          toOneLiner(item.description) ||
          t("dashboardNoSummary"),
        meta: [
          item.createdBy?.name || item.createdBy?.email || t("user"),
          formatDate(item.createdAt),
          t("commentsCount", { count: item.commentCount ?? 0 }),
        ]
          .filter(Boolean)
          .join(" · "),
        path: `/discussion/${item._id}`,
      })),
    [discussions, t],
  );

  const competitionRows = useMemo(
    () =>
      competitions.map((item) => ({
        id: item._id,
        title: item.title,
        category: t("competition"),
        summary:
          toOneLiner(item.description) ||
          t("dashboardNoSummary"),
        meta: [
          item.createdBy?.name || item.createdBy?.email || t("user"),
          formatDate(item.createdAt),
          t("dashboardEntriesCount", { count: item.entryCount ?? 0 }),
          t("commentsCount", { count: item.commentCount ?? 0 }),
        ]
          .filter(Boolean)
          .join(" · "),
        path: `/competitions/${item._id}`,
      })),
    [competitions, t],
  );

  if (!canAccess) {
    return <Navigate to="/discussion" replace />;
  }

  const rows = activeTab === "discussions" ? discussionRows : competitionRows;

  return (
    <div className="admin-dashboard">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h1 className="page-title mb-1">{t("dashboard")}</h1>
          <p className="page-subtitle mb-0">{t("dashboardSubtitle")}</p>
        </div>
      </div>

      <div className="dashboard-tabs mb-3">
        <button
          type="button"
          className={`chip ${activeTab === "discussions" ? "active" : ""}`}
          onClick={() => setActiveTab("discussions")}
        >
          {t("discussions")} ({discussionRows.length})
        </button>
        <button
          type="button"
          className={`chip ${activeTab === "competitions" ? "active" : ""}`}
          onClick={() => setActiveTab("competitions")}
        >
          {t("competitions")} ({competitionRows.length})
        </button>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-3 mb-0">{t("loadingDashboard")}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="discussion-card text-center text-muted py-5">
          {activeTab === "discussions"
            ? t("noDiscussions")
            : t("noCompetitions")}
        </div>
      ) : (
        <div className="dashboard-review-list">
          {rows.map((row) => (
            <article className="discussion-card dashboard-review-card" key={row.id}>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div className="dashboard-review-main">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <span className="tag">{row.category}</span>
                    <span className="time-text">{row.meta}</span>
                  </div>

                  <TranslatedContent
                    as="h2"
                    className="card-title mb-2"
                    text={row.title}
                  />

                  <p className="dashboard-review-summary mb-0">{row.summary}</p>
                </div>

                <button
                  type="button"
                  className="btn btn-brand dashboard-view-btn"
                  onClick={() => navigate(row.path)}
                >
                  {t("view")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-3">
        <Link to="/discussion" className="back-link">
          <i className="bi bi-arrow-left"></i>
          {t("backButton")}
        </Link>
      </div>
    </div>
  );
}
