import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";

import { API_URL } from "../../../core/config/env";
import { useLanguage } from "../../../core/context/LanguageContext";
import { getProfileImageUrl } from "../../../core/utils/profileImage";
import {
  DEFAULT_COMPETITION_IMAGE,
  getCompetitionImageUrl,
} from "../../../core/utils/mediaDefaults";
import TranslatedContent from "../../../core/i18n/TranslatedContent";
import VideoMedia from "../../../sharedComponent/VideoMedia";

interface CompetitionItem {
  _id: string;
  title: string;
  description?: string;
  video?: string;
  youtubeUrl?: string;
  image?: string;
  createdBy?: {
    name?: string;
    email?: string;
    profileImage?: string;
  };
  createdAt?: string;
  supportCount?: number;
  againstCount?: number;
  commentCount?: number;
  entryCount?: number;
}

interface OutletContext {
  searchKeyword?: string;
}

const CompetitionList: React.FC = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext<OutletContext | undefined>();
  const { t } = useLanguage();
  const searchKeyword = (outletContext?.searchKeyword || "").trim().toLowerCase();

  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_URL}/competitions`);
        setCompetitions(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (loadError: any) {
        setError(
          loadError.response?.data?.message || t("failedLoadCompetitions"),
        );
      } finally {
        setLoading(false);
      }
    };

    loadCompetitions();
  }, [t]);

  const filteredCompetitions = useMemo(() => {
    if (!searchKeyword) {
      return competitions;
    }

    return competitions.filter((competition) => {
      const haystack = `${competition.title} ${competition.description || ""}`.toLowerCase();
      return haystack.includes(searchKeyword);
    });
  }, [competitions, searchKeyword]);

  const handleCreate = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    navigate("/start-competition");
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            {searchKeyword
              ? t("searchResultsFor", { query: outletContext?.searchKeyword || "" })
              : t("latestCompetitions")}
          </h2>
          <p className="text-muted mb-0">{t("exploreCompetitions")}</p>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          + {t("startCompetition")}
        </button>
      </div>

      {loading && (
        <div className="text-center py-5 text-muted">{t("loadingCompetitions")}</div>
      )}

      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && filteredCompetitions.length > 0 && (
        <div className="row">
          {filteredCompetitions.map((competition) => {
            const authorName =
              competition.createdBy?.name ||
              competition.createdBy?.email ||
              t("user");

            return (
              <div className="col-12 mb-4" key={competition._id}>
                <article className="discussion-card">
                  <div className="row g-3">
                    <div className="col-md-3 col-lg-2">
                      <div className="thumb competition-thumb">
                        {competition.video || competition.youtubeUrl ? (
                          <VideoMedia
                            video={competition.video}
                            youtubeUrl={competition.youtubeUrl}
                            title={competition.title}
                          />
                        ) : (
                          <img
                            src={getCompetitionImageUrl(competition.image)}
                            alt={competition.title}
                            onError={(event) => {
                              event.currentTarget.src = DEFAULT_COMPETITION_IMAGE;
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="col-md-9 col-lg-10 d-flex flex-column">
                      <TranslatedContent
                        as="h2"
                        className="card-title mb-1"
                        text={competition.title}
                      />

                      {competition.description ? (
                        <TranslatedContent
                          as="div"
                          className="card-desc mb-2"
                          text={competition.description}
                          style={{
                            color: "#374151",
                            fontSize: ".95rem",
                          }}
                        />
                      ) : null}

                      <div className="d-flex align-items-center gap-2 flex-wrap mb-2 profileImage">
                        <img
                          src={getProfileImageUrl(competition.createdBy?.profileImage)}
                          alt={authorName}
                        />
                        <span className="author-name">{authorName}</span>
                        <span className="tag">{t("competition")}</span>
                        <span className="time-text ms-auto">
                          {competition.createdAt
                            ? new Date(competition.createdAt).toLocaleDateString("en-IN")
                            : ""}
                        </span>
                      </div>

                      <div className="card-footer-custom">
                        <span className="stat">
                          <i className="bi bi-chat-square-text me-1"></i>
                          {competition.commentCount ?? 0}
                        </span>
                        <span className="stat">
                          <i className="bi bi-file-earmark-text me-1"></i>
                          {competition.entryCount ?? 0}
                        </span>
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          className="btn btn-outline-primary action-icon-btn"
                          aria-label={t("viewCompetition")}
                          title={t("viewCompetition")}
                          onClick={() => navigate(`/competitions/${competition._id}`)}
                        >
                          <i className="bi bi-eye"></i>
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

      {!loading && !error && filteredCompetitions.length === 0 && (
        <div className="text-center py-5">
          <h5>{t("noCompetitions")}</h5>
          <p className="text-muted">
            {searchKeyword ? t("noCompetitionSearchMatches") : t("beFirstCompetition")}
          </p>
          <button type="button" className="btn btn-primary" onClick={handleCreate}>
            {t("startCompetition")}
          </button>
        </div>
      )}
    </>
  );
};

export default CompetitionList;
