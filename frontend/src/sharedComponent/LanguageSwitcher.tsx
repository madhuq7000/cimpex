import type { FC } from "react";

import { useLanguage } from "../core/context/LanguageContext";
import type { Language } from "../core/i18n/translations";

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ className = "" }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`language-switcher ${className}`.trim()}>
      <span className="visually-hidden">{t("language")}</span>
      <i className="bi bi-translate" aria-hidden="true"></i>
      <select
        value={language}
        aria-label={t("language")}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        <option value="en">{t("english")}</option>
        <option value="hi">{t("hindi")}</option>
      </select>
    </label>
  );
};

export default LanguageSwitcher;
