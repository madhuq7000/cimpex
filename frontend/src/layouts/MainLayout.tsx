import { useEffect, useState } from "react";
import type { FC, FormEvent } from "react";

import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import "./MainLayout.css";
import SidebarNav from "./SidebarNav";

import type { Category } from "../features/category/types";
import { getCategoriesApi } from "../features/category/categoryApi";
import logoImage from "../assets/images/logo.png";

import { useAuth } from "../core/context/AuthContext";
import { useLanguage } from "../core/context/LanguageContext";
import { SERVER_URL } from "../core/config/env";
import LanguageSwitcher from "../sharedComponent/LanguageSwitcher";

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

  const getProfileImageUrl = () => {
    const profileImage = loggedInUser?.profileImage;

    if (!profileImage) {
      return `${SERVER_URL}/uploads/profiles/default-profile.png`;
    }

    // Complete URL already returned by backend
    if (
      profileImage.startsWith("http://") ||
      profileImage.startsWith("https://")
    ) {
      return profileImage;
    }

    // Backend returned:
    // /uploads/profiles/image.jpg
    if (profileImage.startsWith("/uploads/")) {
      return `${SERVER_URL}${profileImage}`;
    }

    // Backend returned only:
    // image.jpg
    return `${SERVER_URL}/uploads/profiles/${profileImage}`;
  };

  const profileImageUrl = getProfileImageUrl();

  // ==========================================
  // PROFILE IMAGE ERROR
  // ==========================================

  const handleProfileImageError = (
    e: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    const defaultImage = `${SERVER_URL}/uploads/profiles/default-profile.png`;

    // Prevent infinite error loop
    if (e.currentTarget.src !== defaultImage) {
      e.currentTarget.src = defaultImage;
    }
  };

  // ==========================================
  // STATES
  // ==========================================

  const [categories, setCategories] = useState<Category[]>([]);

  const [searchKeyword, setSearchKeyword] = useState("");

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
      navigate(`/discussion?q=${encodeURIComponent(keyword)}`);
      return;
    }

    clearSearch();
  };

  return (
    <>
      {/* ================= HEADER ================= */}

      <header className="topbar d-flex align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          {/* MOBILE MENU */}

          <button
            className="btn mobile-toggle p-2"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#sidebarOffcanvas"
            aria-label="Open menu"
          >
            <i className="bi bi-list fs-4"></i>
          </button>

          {/* LOGO */}

          <Link
            to="/discussion"
            className="d-flex align-items-center gap-2 text-decoration-none"
          >
            <img src={logoImage} className="headerLogo" alt="VaadSamvaad" />

            <span className="brand-name">VaadSamvaad</span>
          </Link>
        </div>

        {/* ================= SEARCH ================= */}

        <form
          className="search-box flex-grow-1 mx-3"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <i className="bi bi-search"></i>

          <input
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
        </form>

        {/* ================= USER / GUEST ================= */}

        <div className="d-flex align-items-center gap-2 gap-sm-3 flex-shrink-0">
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
            <div className="d-flex align-items-center gap-2">
              <Link to="/login" className="btn btn-outline-primary">
                {t("login")}
              </Link>

              <Link to="/register" className="btn btn-primary">
                {t("register")}
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <div className="container-fluid">
        <div className="row">
          {/* ================= DESKTOP SIDEBAR ================= */}

          <aside className="col-lg-3 col-xl-2 px-0 sidebar-col">
            <div className="sidebar">
              <SidebarNav />

              {/* ================= START DISCUSSION ================= */}

              {isAuthenticated ? (
                <Link
                  to="/start-discussion"
                  className="start-btn d-flex align-items-center justify-content-center gap-2"
                  style={{
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  <i className="bi bi-plus-lg"></i>
                  {t("startDiscussion")}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="start-btn d-flex align-items-center justify-content-center gap-2"
                  style={{
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  <i className="bi bi-box-arrow-in-right"></i>
                  {t("loginToStartDiscussion")}
                </Link>
              )}

              {/* ================= PROFILE / GUEST ================= */}

              {isAuthenticated ? (
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
              ) : (
                <div className="mt-auto p-3">
                  <div className="d-grid gap-2">
                    <Link to="/login" className="btn btn-outline-primary">
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      {t("login")}
                    </Link>

                    <Link to="/register" className="btn btn-primary">
                      <i className="bi bi-person-plus me-2"></i>
                      {t("register")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ================= MOBILE SIDEBAR ================= */}

          <div
            className="offcanvas offcanvas-start"
            tabIndex={-1}
            id="sidebarOffcanvas"
          >
            <div className="offcanvas-header">
              <span className="d-flex align-items-center gap-2">
                <span className="brand-mark">
                  <i className="bi bi-chat-dots-fill"></i>
                </span>

                <span className="brand-name">VaadSamvaad</span>
              </span>

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

                {/* ================= START DISCUSSION ================= */}

                {isAuthenticated ? (
                  <Link
                    to="/start-discussion"
                    className="start-btn w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{
                      color: "#fff",
                      textDecoration: "none",
                    }}
                    data-bs-dismiss="offcanvas"
                  >
                    <i className="bi bi-plus-lg"></i>
                    {t("startDiscussion")}
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="start-btn w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{
                      color: "#fff",
                      textDecoration: "none",
                    }}
                    data-bs-dismiss="offcanvas"
                  >
                    <i className="bi bi-box-arrow-in-right"></i>
                    {t("loginToStartDiscussion")}
                  </Link>
                )}

                {/* ================= PROFILE / GUEST ================= */}

                {isAuthenticated ? (
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
                ) : (
                  <div className="p-3">
                    <div className="d-grid gap-2">
                      <Link
                        to="/login"
                        className="btn btn-outline-primary"
                        data-bs-dismiss="offcanvas"
                      >
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        {t("login")}
                      </Link>

                      <Link
                        to="/register"
                        className="btn btn-primary"
                        data-bs-dismiss="offcanvas"
                      >
                        <i className="bi bi-person-plus me-2"></i>
                        {t("register")}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= ROUTE CONTENT ================= */}

          <main className="col-lg-9 col-xl-10 main-wrap">
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

      {/* ================= FEATURES ================= */}

      <section className="features-section">
        <h2 className="features-title">{t("whyJoin")}</h2>

        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-6 col-md-3">
              <div className="feature-item">
                <div className="feature-icon purple">
                  <i className="bi bi-chat-square-text-fill"></i>
                </div>

                <h5>{t("meaningfulDiscussions")}</h5>

                <p>{t("meaningfulDiscussionsDesc")}</p>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="feature-item">
                <div className="feature-icon green">
                  <i className="bi bi-chat-dots-fill"></i>
                </div>

                <h5>{t("shareYourViews")}</h5>

                <p>{t("shareYourViewsDesc")}</p>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="feature-item">
                <div className="feature-icon orange">
                  <i className="bi bi-people-fill"></i>
                </div>

                <h5>{t("buildCommunity")}</h5>

                <p>{t("buildCommunityDesc")}</p>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="feature-item">
                <div className="feature-icon red">
                  <i className="bi bi-shield-fill-check"></i>
                </div>

                <h5>{t("safeRespectful")}</h5>

                <p>{t("safeRespectfulDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MainLayout;
