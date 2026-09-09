import type { FC } from "react";

import { useLanguage } from "../core/context/LanguageContext";
import type { TranslationKey } from "../core/i18n/translations";

export type MediaAttachKind = "" | "image" | "video" | "document";

interface MediaAttachSelectProps {
  value: MediaAttachKind;
  options: Array<"image" | "video" | "document">;
  onChange: (value: MediaAttachKind) => void;
}

const OPTION_LABELS: Record<"image" | "video" | "document", TranslationKey> = {
  image: "uploadImage",
  video: "uploadVideo",
  document: "uploadDocOrPdf",
};

const MediaAttachSelect: FC<MediaAttachSelectProps> = ({
  value,
  options,
  onChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="mb-4">
      <label className="field-label mb-2">{t("selectMediaType")}</label>
      <select
        className="form-select"
        value={value}
        onChange={(event) =>
          onChange(event.target.value as MediaAttachKind)
        }
      >
        <option value="">{t("mediaTypeNone")}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {t(OPTION_LABELS[option])}
          </option>
        ))}
      </select>
      <div className="upload-hint mt-1">{t("selectMediaTypeHint")}</div>
    </div>
  );
};

export default MediaAttachSelect;
