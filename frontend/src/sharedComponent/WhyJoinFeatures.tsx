import { useLanguage } from "../core/context/LanguageContext";
import "./WhyJoinFeatures.css";

export default function WhyJoinFeatures() {
  const { t } = useLanguage();

  return (
    <section className="features-section">
      <h2 className="features-title">{t("whyJoin")}</h2>

      <div className="features-list">
        <div className="feature-item">
          <div className="feature-icon">
            <i className="bi bi-chat-dots"></i>
          </div>
          <div className="feature-copy">
            <h5>{t("meaningfulDiscussions")}</h5>
            <p>{t("meaningfulDiscussionsDesc")}</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <i className="bi bi-megaphone"></i>
          </div>
          <div className="feature-copy">
            <h5>{t("shareYourViews")}</h5>
            <p>{t("shareYourViewsDesc")}</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <i className="bi bi-people"></i>
          </div>
          <div className="feature-copy">
            <h5>{t("buildCommunity")}</h5>
            <p>{t("buildCommunityDesc")}</p>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <i className="bi bi-shield-check"></i>
          </div>
          <div className="feature-copy">
            <h5>{t("safeRespectful")}</h5>
            <p>{t("safeRespectfulDesc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
