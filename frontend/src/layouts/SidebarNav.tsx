import type { FC } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../core/context/AuthContext";
import { useLanguage } from "../core/context/LanguageContext";

interface SidebarNavProps {
  dismissOffcanvas?: boolean;
}

const SidebarNav: FC<SidebarNavProps> = ({ dismissOffcanvas = false }) => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const dismiss = dismissOffcanvas ? "offcanvas" : undefined;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link-custom${isActive ? " active" : ""}`;

  return (
    <nav className="nav flex-column mb-3">
      <NavLink
        to="/discussion"
        end
        className={navClass}
        data-bs-dismiss={dismiss}
      >
        <i className="bi bi-search"></i>
        {t("discussions")}
      </NavLink>

      <NavLink
        to="/competitions"
        className={navClass}
        data-bs-dismiss={dismiss}
      >
        <i className="bi bi-trophy"></i>
        {t("competitions")}
      </NavLink>

      <NavLink to="/add-category" className={navClass} data-bs-dismiss={dismiss}>
        <i className="bi bi-plus-circle-fill"></i>
        {t("addCategory")}
      </NavLink>

      {isAuthenticated && (
        <NavLink
          to="/start-discussion"
          className={navClass}
          data-bs-dismiss={dismiss}
        >
          <i className="bi bi-plus-lg"></i>
          {t("startDiscussion")}
        </NavLink>
      )}

      <NavLink to="/faq" className={navClass} data-bs-dismiss={dismiss}>
        <i className="bi bi-question-circle-fill"></i>
        {t("faq")}
      </NavLink>

      <NavLink
        to="/community-guidelines"
        className={navClass}
        data-bs-dismiss={dismiss}
      >
        <i className="bi bi-journal-text"></i>
        {t("communityGuidelines")}
      </NavLink>
    </nav>
  );
};

export default SidebarNav;
