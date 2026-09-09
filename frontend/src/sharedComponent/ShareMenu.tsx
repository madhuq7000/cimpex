import { useEffect, useRef, useState } from "react";
import type { FC } from "react";

import { useLanguage } from "../core/context/LanguageContext";
import {
  copyTextToClipboard,
  getFacebookShareUrl,
  getPublicUrl,
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  openShareWindow,
} from "../core/utils/share";

interface ShareMenuProps {
  path: string;
  title: string;
}

const ShareMenu: FC<ShareMenuProps> = ({ path, title }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const shareUrl = () => getPublicUrl(path);

  const handleFacebook = () => {
    openShareWindow(getFacebookShareUrl(shareUrl()));
    setOpen(false);
    setNotice("");
  };

  const handleTwitter = () => {
    openShareWindow(getTwitterShareUrl(shareUrl(), title));
    setOpen(false);
    setNotice("");
  };

  const handleWhatsApp = () => {
    openShareWindow(getWhatsAppShareUrl(shareUrl(), title));
    setOpen(false);
    setNotice("");
  };

  const handleCopyShare = async (message: string, openUrl?: string) => {
    try {
      await copyTextToClipboard(shareUrl());
      setNotice(message);

      if (openUrl) {
        openShareWindow(openUrl);
      }
    } catch {
      setNotice(t("copyFailed"));
    } finally {
      setOpen(false);
    }
  };

  const handleInstagram = () => {
    void handleCopyShare(t("linkCopiedInstagram"), "https://www.instagram.com/");
  };

  const handleYouTube = () => {
    void handleCopyShare(t("linkCopiedYouTube"), "https://www.youtube.com/");
  };

  return (
    <div className="share-menu" ref={menuRef}>
      <button
        type="button"
        className="share-link"
        aria-label={t("share")}
        title={t("share")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setOpen((current) => !current);
          setNotice("");
        }}
      >
        <i className="bi bi-share"></i>
        {t("share")}
      </button>

      {open && (
        <div className="share-menu-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={handleFacebook}>
            <i className="bi bi-facebook"></i>
            {t("shareFacebook")}
          </button>
          <button type="button" role="menuitem" onClick={handleInstagram}>
            <i className="bi bi-instagram"></i>
            {t("shareInstagram")}
          </button>
          <button type="button" role="menuitem" onClick={handleYouTube}>
            <i className="bi bi-youtube"></i>
            {t("shareYouTube")}
          </button>
          <button type="button" role="menuitem" onClick={handleTwitter}>
            <i className="bi bi-twitter-x"></i>
            {t("shareTwitter")}
          </button>
          <button type="button" role="menuitem" onClick={handleWhatsApp}>
            <i className="bi bi-whatsapp"></i>
            {t("shareWhatsApp")}
          </button>
        </div>
      )}

      {notice && <div className="share-menu-notice">{notice}</div>}
    </div>
  );
};

export default ShareMenu;
