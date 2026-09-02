import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  translations,
  type Language,
  type TranslationKey,
} from "../i18n/translations";

const LANGUAGE_STORAGE_KEY = "vaadsamvaad-language";

type TranslateVars = Record<string, string | number>;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: TranslateVars) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const getStoredLanguage = (): Language => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (stored === "hi" || stored === "en") {
    return stored;
  }

  return "en";
};

const applyTemplate = (text: string, vars?: TranslateVars) => {
  if (!vars) {
    return text;
  }

  return Object.entries(vars).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
    text,
  );
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language === "hi" ? "hi" : "en";
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  };

  const t = (key: TranslationKey, vars?: TranslateVars) => {
    const dictionary = translations[language];
    return applyTemplate(dictionary[key] || translations.en[key], vars);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
};
