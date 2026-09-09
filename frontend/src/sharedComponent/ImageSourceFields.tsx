import { useEffect, useState } from "react";
import type { ChangeEvent, FC } from "react";

import { SERVER_URL } from "../core/config/env";
import { useLanguage } from "../core/context/LanguageContext";

interface ImageSourceFieldsProps {
  inputId: string;
  image: File | null;
  existingImage?: string;
  onImageChange: (file: File | null) => void;
  onRemoveExistingImage?: () => void;
  onError?: (message: string) => void;
}

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const ImageSourceFields: FC<ImageSourceFieldsProps> = ({
  inputId,
  image,
  existingImage,
  onImageChange,
  onRemoveExistingImage,
  onError,
}) => {
  const { t } = useLanguage();
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(image);
    setPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [image]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError?.(t("imageTooLarge"));
      event.target.value = "";
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      onError?.(t("onlyImageTypes"));
      event.target.value = "";
      return;
    }

    onImageChange(file);
    event.target.value = "";
  };

  const handleRemoveFile = () => {
    onImageChange(null);

    const input = document.getElementById(inputId) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };

  return (
    <div className="mb-4">
      <label className="field-label mb-2">
        {t("uploadImage")} <span className="optional">{t("optional")}</span>
      </label>

      {existingImage && !image && (
        <div className="mb-3">
          <small className="text-muted d-block mb-2">{t("currentImage")}</small>
          <img
            src={`${SERVER_URL}${existingImage}`}
            alt={t("currentImage")}
            style={{
              width: "200px",
              height: "130px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
          {onRemoveExistingImage && (
            <button
              type="button"
              className="btn btn-sm btn-danger ms-2"
              onClick={onRemoveExistingImage}
            >
              {t("remove")}
            </button>
          )}
        </div>
      )}

      <label htmlFor={inputId} className="upload-box" style={{ cursor: "pointer" }}>
        <i className="bi bi-image d-block mb-2"></i>
        <div>{image ? image.name : t("dropImage")}</div>
        <div>
          <span className="upload-link">{t("orClickBrowse")}</span>
        </div>
        <div className="upload-hint mt-1">{t("imageHint")}</div>
        <input
          type="file"
          id={inputId}
          accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
          className="d-none"
          onChange={handleFileChange}
        />
      </label>

      {preview && (
        <div className="mt-3">
          <img
            src={preview}
            alt={image?.name || t("uploadImage")}
            style={{
              width: "200px",
              height: "130px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
        </div>
      )}

      {image && (
        <div className="mt-2">
          <small className="text-muted">{t("selected", { name: image.name })}</small>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={handleRemoveFile}
          >
            {t("remove")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageSourceFields;
