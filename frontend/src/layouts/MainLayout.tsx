import { useEffect, useState } from "react";
import type { FC } from "react";

import { Link, Outlet, useNavigate } from "react-router-dom";

import "./MainLayout.css";

import type { Category } from "../features/category/types";
import { getCategoriesApi } from "../features/category/categoryApi";
import logoImage from "../assets/images/logo.png";

import { useAuth } from "../core/context/AuthContext";

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

  // ==========================================
  // AUTH
  // ==========================================

  const { logout, isAuthenticated } = useAuth();

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
  // SERVER URL
  // ==========================================

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://www.vaadsamvaad.com";

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

    navigate("/discussion", {
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

        <div className="search-box flex-grow-1 mx-3 d-none d-sm-block">
          <i className="bi bi-search"></i>

          <input
            type="text"
            className="form-control"
            placeholder="Search discussions..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        {/* ================= USER / GUEST ================= */}

        <div className="d-flex align-items-center gap-2 gap-sm-3 flex-shrink-0">
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
                    alt={loggedInUser?.name || "User"}
                    onError={handleProfileImageError}
                  />

                  <span>{loggedInUser?.name || "User"}</span>
                </span>
              </a>

              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <div className="px-3 py-2">
                    <div className="fw-semibold">
                      {loggedInUser?.name || "User"}
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
                  <Link className="dropdown-item" to="/profile">
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item" to="/settings">
                    <i className="bi bi-gear me-2"></i>
                    Settings
                  </Link>
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
                    Log Out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <Link to="/login" className="btn btn-outline-primary btn-sm">
                Login
              </Link>

              <Link to="/register" className="btn btn-primary btn-sm">
                Register
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
              <nav className="nav flex-column mb-3">
                {/* ================= PUBLIC ================= */}

                <Link to="/discussion" className="nav-link-custom">
                  <i className="bi bi-search"></i>
                  Browse Discussions
                </Link>

                {/* ================= CATEGORY ================= */}

                <Link
                  to={isAuthenticated ? "/add-category" : "/login"}
                  className="nav-link-custom"
                >
                  <i className="bi bi-plus-circle-fill"></i>
                  Add Category
                </Link>

                {/* ================= MY DISCUSSIONS ================= */}

                <Link
                  to={isAuthenticated ? "/my-discussions" : "/login"}
                  className="nav-link-custom"
                >
                  <i className="bi bi-pencil-square"></i>
                  My Discussions
                </Link>

                {/* ================= BOOKMARKS ================= */}

                <Link
                  to={isAuthenticated ? "/bookmarks" : "/login"}
                  className="nav-link-custom"
                >
                  <i className="bi bi-bookmark-fill"></i>
                  Bookmarks
                </Link>

                {/* ================= NOTIFICATIONS ================= */}

                <Link
                  to={isAuthenticated ? "/notifications" : "/login"}
                  className="nav-link-custom"
                >
                  <i className="bi bi-bell-fill"></i>
                  Notifications
                </Link>

                {/* ================= PROFILE ================= */}

                <Link
                  to={isAuthenticated ? "/profile" : "/login"}
                  className="nav-link-custom"
                >
                  <i className="bi bi-person-fill"></i>
                  Profile
                </Link>

                {/* ================= SETTINGS ================= */}

                <Link
                  to={isAuthenticated ? "/settings" : "/login"}
                  className="nav-link-custom"
                >
                  <i className="bi bi-gear-fill"></i>
                  Settings
                </Link>
              </nav>

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
                  Start Discussion
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
                  Login to Start Discussion
                </Link>
              )}

              {/* ================= PROFILE / GUEST ================= */}

              {isAuthenticated ? (
                <div className="mt-auto sidebar-profile">
                  <img
                    src={profileImageUrl}
                    alt={loggedInUser?.name || "User"}
                    onError={handleProfileImageError}
                  />

                  <div>
                    <div className="name">{loggedInUser?.name || "User"}</div>

                    <div className="email">{loggedInUser?.email || ""}</div>

                    <button
                      type="button"
                      className="logout-link"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-1"></i>
                      Log Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-auto p-3">
                  <div className="d-grid gap-2">
                    <Link to="/login" className="btn btn-outline-primary">
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Login
                    </Link>

                    <Link to="/register" className="btn btn-primary">
                      <i className="bi bi-person-plus me-2"></i>
                      Register
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
                aria-label="Close"
              ></button>
            </div>

            <div className="offcanvas-body p-0">
              <div
                className="sidebar"
                style={{
                  minHeight: "auto",
                }}
              >
                <nav className="nav flex-column mb-3">
                  {/* ================= PUBLIC ================= */}

                  <Link
                    to="/discussion"
                    className="nav-link-custom"
                    data-bs-dismiss="offcanvas"
                  >
                    <i className="bi bi-search"></i>
                    Browse Discussions
                  </Link>

                  {/* ================= CATEGORY ================= */}

                  <Link
                    to={isAuthenticated ? "/add-category" : "/login"}
                    className="nav-link-custom"
                    data-bs-dismiss="offcanvas"
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Add Category
                  </Link>

                  {/* ================= MY DISCUSSIONS ================= */}

                  <Link
                    to={isAuthenticated ? "/my-discussions" : "/login"}
                    className="nav-link-custom"
                    data-bs-dismiss="offcanvas"
                  >
                    <i className="bi bi-pencil-square"></i>
                    My Discussions
                  </Link>

                  {/* ================= BOOKMARKS ================= */}

                  <Link
                    to={isAuthenticated ? "/bookmarks" : "/login"}
                    className="nav-link-custom"
                    data-bs-dismiss="offcanvas"
                  >
                    <i className="bi bi-bookmark-fill"></i>
                    Bookmarks
                  </Link>

                  {/* ================= NOTIFICATIONS ================= */}

                  <Link
                    to={isAuthenticated ? "/notifications" : "/login"}
                    className="nav-link-custom"
                    data-bs-dismiss="offcanvas"
                  >
                    <i className="bi bi-bell-fill"></i>
                    Notifications
                  </Link>

                  {/* ================= PROFILE ================= */}

                  <Link
                    to={isAuthenticated ? "/profile" : "/login"}
                    className="nav-link-custom"
                    data-bs-dismiss="offcanvas"
                  >
                    <i className="bi bi-person-fill"></i>
                    Profile
                  </Link>

                  {/* ================= SETTINGS ================= */}

                  <Link
                    to={isAuthenticated ? "/settings" : "/login"}
                    className="nav-link-custom"
                    data-bs-dismiss="offcanvas"
                  >
                    <i className="bi bi-gear-fill"></i>
                    Settings
                  </Link>
                </nav>

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
                    Start Discussion
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
                    Login to Start Discussion
                  </Link>
                )}

                {/* ================= PROFILE / GUEST ================= */}

                {isAuthenticated ? (
                  <div className="sidebar-profile">
                    <img
                      src={profileImageUrl}
                      alt={loggedInUser?.name || "User"}
                      onError={handleProfileImageError}
                    />

                    <div>
                      <div className="name">{loggedInUser?.name || "User"}</div>

                      <div className="email">{loggedInUser?.email || ""}</div>

                      <button
                        type="button"
                        className="logout-link"
                        onClick={handleLogout}
                        data-bs-dismiss="offcanvas"
                      >
                        <i className="bi bi-box-arrow-right me-1"></i>
                        Log Out
                      </button>
                    </div>
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
                        Login
                      </Link>

                      <Link
                        to="/register"
                        className="btn btn-primary"
                        data-bs-dismiss="offcanvas"
                      >
                        <i className="bi bi-person-plus me-2"></i>
                        Register
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
        <h2 className="features-title">Why Join VaadSamvaad?</h2>

        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-6 col-md-3">
              <div className="feature-item">
                <div className="feature-icon purple">
                  <i className="bi bi-chat-square-text-fill"></i>
                </div>

                <h5>Meaningful Discussions</h5>

                <p>Engage in conversations that matter and make an impact.</p>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="feature-item">
                <div className="feature-icon green">
                  <i className="bi bi-chat-dots-fill"></i>
                </div>

                <h5>Share Your Views</h5>

                <p>Express your opinions and learn from others.</p>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="feature-item">
                <div className="feature-icon orange">
                  <i className="bi bi-people-fill"></i>
                </div>

                <h5>Build Community</h5>

                <p>Connect with like-minded people and grow together.</p>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="feature-item">
                <div className="feature-icon red">
                  <i className="bi bi-shield-fill-check"></i>
                </div>

                <h5>Safe &amp; Respectful</h5>

                <p>A positive environment for healthy discussions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MainLayout;
