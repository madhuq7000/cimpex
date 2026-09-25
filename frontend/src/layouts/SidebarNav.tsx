import type { FC } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../core/context/AuthContext";
import { useLanguage } from "../core/context/LanguageContext";
import { isSuperAdminEmail } from "../core/utils/superAdmin";

interface SidebarNavProps {
  onNavigate?: () => void;
}

const SidebarNav: FC<SidebarNavProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const isSuperAdmin = isAuthenticated && isSuperAdminEmail(user?.email);
  const canManageCategories = isSuperAdmin;
  const showAdminDashboard = isSuperAdmin;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link-custom${isActive ? " active" : ""}`;

  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <nav className="nav flex-column mb-3">
      {showAdminDashboard && (
        <NavLink
          to="/dashboard"
          className={navClass}
          onClick={handleNavigate}
        >
          <i className="bi bi-speedometer2"></i>
          {t("dashboard")}
        </NavLink>
      )}

      <NavLink
        to="/discussion"
        end
        className={navClass}
        onClick={handleNavigate}
      >
        <i className="bi bi-search"></i>
        {t("discussions")}
      </NavLink>

      <NavLink to="/competitions" className={navClass} onClick={handleNavigate}>
        <i className="bi bi-trophy"></i>
        {t("competitions")}
      </NavLink>

      {canManageCategories && (
        <NavLink
          to="/add-category"
          className={navClass}
          onClick={handleNavigate}
        >
          <i className="bi bi-plus-circle-fill"></i>
          {t("addCategory")}
        </NavLink>
      )}

      {isAuthenticated && (
        <NavLink
          to="/start-discussion"
          className={navClass}
          onClick={handleNavigate}
        >
          <i className="bi bi-plus-lg"></i>
          {t("startDiscussion")}
        </NavLink>
      )}

      <NavLink to="/faq" className={navClass} onClick={handleNavigate}>
        <i className="bi bi-question-circle-fill"></i>
        {t("faq")}
      </NavLink>

      <NavLink
        to="/community-guidelines"
        className={navClass}
        onClick={handleNavigate}
      >
        <i className="bi bi-journal-text"></i>
        {t("communityGuidelines")}
      </NavLink>
    </nav>
  );
};

export default SidebarNav;
