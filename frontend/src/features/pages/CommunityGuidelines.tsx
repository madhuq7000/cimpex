import type { FC } from "react";

import { useLanguage } from "../../core/context/LanguageContext";
import type { TranslationKey } from "../../core/i18n/translations";

const GUIDELINES: { title: TranslationKey; body: TranslationKey }[] = [
  { title: "guideT1", body: "guideB1" },
  { title: "guideT2", body: "guideB2" },
  { title: "guideT3", body: "guideB3" },
  { title: "guideT4", body: "guideB4" },
  { title: "guideT5", body: "guideB5" },
  { title: "guideT6", body: "guideB6" },
  { title: "guideT7", body: "guideB7" },
  { title: "guideT8", body: "guideB8" },
];

const CommunityGuidelines: FC = () => {
  const { t } = useLanguage();

  return (
    <div className="info-page">
      <h1 className="page-title mb-2">{t("communityGuidelines")}</h1>
      <p className="page-subtitle mb-4">{t("guidelinesIntro")}</p>

      <ol className="guideline-list">
        {GUIDELINES.map((item, index) => (
          <li className="info-card guideline-item" key={item.title}>
            <span className="guideline-number">{index + 1}</span>
            <div>
              <h2>{t(item.title)}</h2>
              <p>{t(item.body)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default CommunityGuidelines;
