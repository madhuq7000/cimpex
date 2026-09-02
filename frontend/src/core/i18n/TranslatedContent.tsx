import { useEffect, useState } from "react";
import type { CSSProperties, ElementType } from "react";
import DOMPurify from "dompurify";

import { useLanguage } from "../context/LanguageContext";
import { translateContent } from "../i18n/translateContent";

interface TranslatedContentProps {
  text: string;
  as?: ElementType;
  className?: string;
  html?: boolean;
  style?: CSSProperties;
}

const TranslatedContent = ({
  text,
  as: Tag = "span",
  className,
  html = false,
  style,
}: TranslatedContentProps) => {
  const { language } = useLanguage();
  const [output, setOutput] = useState(text);
  const [isHtml, setIsHtml] = useState(html && language === "en");

  useEffect(() => {
    let cancelled = false;

    if (!text) {
      setOutput("");
      setIsHtml(false);
      return;
    }

    if (language === "en") {
      setOutput(text);
      setIsHtml(html);
      return;
    }

    translateContent(text, language, { html }).then((translated) => {
      if (!cancelled) {
        setOutput(translated);
        setIsHtml(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [text, language, html]);

  if (isHtml) {
    return (
      <Tag
        className={className}
        style={style}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(output),
        }}
      />
    );
  }

  return (
    <Tag className={className} style={style}>
      {output}
    </Tag>
  );
};

export default TranslatedContent;
