import { useEffect, useRef, useState } from "react";
import type { FC, FormEvent } from "react";

import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import "./MainLayout.css";
import SidebarNav from "./SidebarNav";

import type { Category } from "../features/category/types";
import { getCategoriesApi } from "../features/category/categoryApi";
import logoImage from "../assets/images/logo.png";

import { useAuth } from "../core/context/AuthContext";
import { useLanguage } from "../core/context/LanguageContext";
import {
  getProfileImageUrl as resolveProfileImageUrl,
  handleProfileImageError,
} from "../core/utils/profileImage";
import LanguageSwitcher from "../sharedComponent/LanguageSwitcher";
import WhyJoinFeatures from "../sharedComponent/WhyJoinFeatures";

// ==========================================
// LOGGED IN USER TYPE
// ==========================================

interface LoggedInUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string;
}

const MainLayout: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ==========================================
  // AUTH
  // ==========================================

  const { logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // ==========================================
  // LOGGED IN USER
  // ==========================================

  const storedUser = localStorage.getItem("user");

  let loggedInUser: LoggedInUser | null = null;

  try {
    loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
  }

  // ==========================================
  // PROFILE IMAGE URL
  // ==========================================

  const profileImageUrl = resolveProfileImageUrl(loggedInUser?.profileImage);

  // ==========================================
  // STATES
  // ==========================================

  const [categories, setCategories] = useState<Category[]>([]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [, setSelectedCategory] = useState("All");

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  // ==========================================
  // GET CATEGORIES
  // ==========================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategoriesApi();

        console.log("Categories:", res.data.data);

        setCategories(res.data.data);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const query = searchParams.get("q");

    if (query !== null) {
      setSearchKeyword(query);
      setMobileSearchOpen(true);
    }
  }, [searchParams]);

  const clearSearch = () => {
    setSearchKeyword("");

    if (!searchParams.has("q")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("q");
    const nextSearch = nextParams.toString();

    navigate(
      {
        pathname:
          location.pathname.startsWith("/discussion/") ||
          location.pathname === "/discussion"
            ? "/discussion"
            : location.pathname.startsWith("/competitions/") ||
                location.pathname === "/competitions" ||
                location.pathname === "/start-competition"
              ? "/competitions"
              : location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);

    if (!value.trim()) {
      clearSearch();
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const keyword = searchKeyword.trim();

    if (keyword) {
      const searchPath =
        location.pathname.startsWith("/competitions") ||
        location.pathname === "/start-competition"
          ? "/competitions"
          : "/discussion";

      navigate(`${searchPath}?q=${encodeURIComponent(keyword)}`);
      return;
    }

    clearSearch();
  };

  useEffect(() => {
    if (!mobileSearchOpen) {
      return;
    }

    searchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  return (
    <>
      {/* ================= HEADER ================= */}

      <div className="page-frame">
      <header className="topbar">
        <div className="row g-0 align-items-center topbar-row">
          <div className="col-12 col-lg-3 col-xl-3 topbar-brand-col">
            <Link
              to="/discussion"
              className="topbar-brand d-flex align-items-center gap-2 text-decoration-none"
            >
              <img src={logoImage} className="headerLogo" alt="Amarsa Vimarsa" />
              <span className="brand-name">Amarsa Vimarsa</span>
            </Link>
          </div>

          <div className="col-12 col-lg-9 col-xl-9 topbar-main">
            <button
              className="btn mobile-toggle p-2"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sidebarOffcanvas"
              aria-label="Open menu"
            >
              <i className="bi bi-list fs-4"></i>
            </button>

            <button
              className="search-toggle"
              type="button"
              aria-label={t("searchDiscussions")}
              onClick={() => setMobileSearchOpen(true)}
            >
              <i className="bi bi-search fs-5"></i>
            </button>

            <form
              className={`search-box${mobileSearchOpen ? " is-open" : ""}`}
              onSubmit={handleSearchSubmit}
              role="search"
            >
              <button
                type="button"
                className="search-collapse"
                aria-label={t("close")}
                onClick={() => setMobileSearchOpen(false)}
              >
                <i className="bi bi-arrow-left"></i>
              </button>

              <div className="search-box-field">
                <i className="bi bi-search"></i>

                <input
                  ref={searchInputRef}
                  type="search"
                  className="form-control"
                  placeholder={t("searchDiscussions")}
                  value={searchKeyword}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label={t("searchDiscussions")}
                />

                {searchKeyword && (
                  <button
                    type="button"
                    className="search-clear"
                    aria-label={t("clearSearch")}
                    onClick={clearSearch}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </form>

            <div className="topbar-actions">
              <LanguageSwitcher />

              {isAuthenticated ? (
                <div className="dropdown">
                  <a
                    className="d-flex align-items-center gap-2 text-decoration-none dropdown-toggle"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    onClick={(e) => e.preventDefault()}
                  >
                    <span className="user-chip d-flex align-items-center gap-2">
                      <img
                        src={profileImageUrl}
                        alt={loggedInUser?.name || t("user")}
                        onError={handleProfileImageError}
                      />

                      <span>{loggedInUser?.name || t("user")}</span>
                    </span>
                  </a>

                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <div className="px-3 py-2">
                        <div className="fw-semibold">
                          {loggedInUser?.name || t("user")}
                        </div>

                        {loggedInUser?.email && (
                          <small className="text-muted">{loggedInUser.email}</small>
                        )}
                      </div>
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    <li>
                      <button
                        type="button"
                        className="dropdown-item text-danger logout"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        {t("logOut")}
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="topbar-auth">
                  <Link to="/login" className="btn btn-outline-primary">
                    {t("login")}
                  </Link>

                  <Link to="/register" className="btn btn-primary">
                    {t("register")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <div className="row g-0 page-body">
          {/* ================= DESKTOP SIDEBAR ================= */}

          <aside className="col-lg-3 col-xl-3 px-0 sidebar-col">
            <div className="sidebar">
              <SidebarNav />

              {isAuthenticated && (
                <div className="mt-auto sidebar-profile">
                  <div className="sidebar-profile-user">
                    <img
                      src={profileImageUrl}
                      alt={loggedInUser?.name || t("user")}
                      onError={handleProfileImageError}
                    />

                    <div>
                      <div className="name">{loggedInUser?.name || t("user")}</div>
                      <div className="email">{loggedInUser?.email || ""}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-primary w-100"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    {t("logOut")}
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ================= ROUTE CONTENT ================= */}

          <div className="col-lg-9 col-xl-9 content-col px-0">
          <main className="main-wrap">
            <Outlet
              context={{
                searchKeyword,
                setSelectedCategory,
                categories,
              }}
            />
          </main>
          </div>
        </div>

          <WhyJoinFeatures />
      </div>

      <div
        className="offcanvas offcanvas-start"
        tabIndex={-1}
        id="sidebarOffcanvas"
      >
        <div className="offcanvas-header">
          <Link
            to="/discussion"
            className="d-flex align-items-center gap-2 text-decoration-none"
            data-bs-dismiss="offcanvas"
          >
            <img src={logoImage} className="headerLogo" alt="Amarsa Vimarsa" />
            <span className="brand-name">Amarsa Vimarsa</span>
          </Link>

          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label={t("close")}
          ></button>
        </div>

        <div className="offcanvas-body p-0">
          <div
            className="sidebar"
            style={{
              minHeight: "auto",
            }}
          >
            <SidebarNav dismissOffcanvas />

            {isAuthenticated && (
              <div className="sidebar-profile">
                <div className="sidebar-profile-user">
                  <img
                    src={profileImageUrl}
                    alt={loggedInUser?.name || t("user")}
                    onError={handleProfileImageError}
                  />

                  <div>
                    <div className="name">{loggedInUser?.name || t("user")}</div>
                    <div className="email">{loggedInUser?.email || ""}</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={handleLogout}
                  data-bs-dismiss="offcanvas"
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  {t("logOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
