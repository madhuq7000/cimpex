import type { FC } from "react";

import { useLanguage } from "../../core/context/LanguageContext";
import type { TranslationKey } from "../../core/i18n/translations";

const FAQ_ITEMS: { question: TranslationKey; answer: TranslationKey }[] = [
  { question: "faqQ1", answer: "faqA1" },
  { question: "faqQ2", answer: "faqA2" },
  { question: "faqQ3", answer: "faqA3" },
  { question: "faqQ4", answer: "faqA4" },
  { question: "faqQ5", answer: "faqA5" },
  { question: "faqQ6", answer: "faqA6" },
  { question: "faqQ7", answer: "faqA7" },
];

const Faq: FC = () => {
  const { t } = useLanguage();

  return (
    <div className="info-page">
      <h1 className="page-title mb-2">{t("faq")}</h1>
      <p className="page-subtitle mb-4">{t("faqIntro")}</p>

      <div className="accordion" id="faqAccordion">
        {FAQ_ITEMS.map((item, index) => {
          const headingId = `faq-heading-${index}`;
          const collapseId = `faq-collapse-${index}`;

          return (
            <div className="accordion-item info-card" key={item.question}>
              <h2 className="accordion-header" id={headingId}>
                <button
                  className={`accordion-button${index === 0 ? "" : " collapsed"}`}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#${collapseId}`}
                  aria-expanded={index === 0 ? "true" : "false"}
                  aria-controls={collapseId}
                >
                  {t(item.question)}
                </button>
              </h2>

              <div
                id={collapseId}
                className={`accordion-collapse collapse${index === 0 ? " show" : ""}`}
                aria-labelledby={headingId}
                data-bs-parent="#faqAccordion"
              >
                <div className="accordion-body">{t(item.answer)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Faq;
