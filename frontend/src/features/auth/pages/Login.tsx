// features/auth/pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../authApi";
import { useAuth } from "../../../core/context/AuthContext";
import { useLanguage } from "../../../core/context/LanguageContext";
import type { LoginPayload } from "../types";
import loginImage from "../../../assets/images/login.png";
import logoImage from "../../../assets/images/logo.png";
import LanguageSwitcher from "../../../sharedComponent/LanguageSwitcher";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await loginApi(form);

      console.log("Login response>>>>:", res.data);

      login(res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/discussion");
    } catch (err: any) {
      setError(err.response?.data?.message || t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <div className="auth-language">
        <LanguageSwitcher />
      </div>
      <div className="auth-panel row g-0">
        {/* Left: brand / illustration / features */}
        <div className="col-lg-6 left-side">
          <div className="brand-mark">
            <span>
              <img src={logoImage} className="logo" alt="VaadSamvaad Logo" />
            </span>

            <span>
              <span className="vaad">Vaad</span>
              <span className="samvaad">Samvaad</span>
            </span>
          </div>

          <h1 className="hero-title">
            {t("welcomeBack")} <span className="accent">{t("back")}</span>
          </h1>

          <p className="hero-copy">{t("loginHero")}</p>

          <div className="illustration-wrap">
            <img src={loginImage} alt="Login illustration" />
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">
                <i className="bi bi-chat-dots"></i>
              </span>

              <div>
                <div className="feature-title">{t("meaningfulDiscussions")}</div>
                <div className="feature-desc">
                  {t("meaningfulDiscussionsDesc")}
                </div>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">
                <i className="bi bi-megaphone"></i>
              </span>

              <div>
                <div className="feature-title">{t("shareYourViews")}</div>
                <div className="feature-desc">
                  {t("shareYourViewsDesc")}
                </div>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">
                <i className="bi bi-people"></i>
              </span>

              <div>
                <div className="feature-title">{t("buildCommunity")}</div>
                <div className="feature-desc">
                  {t("buildCommunityDesc")}
                </div>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">
                <i className="bi bi-shield-check"></i>
              </span>

              <div>
                <div className="feature-title">{t("safeRespectful")}</div>
                <div className="feature-desc">
                  {t("safeRespectfulDesc")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login form */}
        <div className="col-lg-6 right-side">
          <h2 className="login-title">
            {t("loginToVaad")} <span className="accent">VaadSamvaad</span>
          </h2>

          <p className="login-sub">{t("welcomeEnterDetails")}</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="field-label">{t("emailAddress")}</label>
              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("enterEmail")}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="field-label">{t("password")}</label>
              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t("enterPassword")}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-login w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? t("loggingIn") : t("login")}
              <i className="bi bi-arrow-right"></i>
            </button>
          </form>

          <p className="register-line">
            {t("noAccount")} <Link to="/register">{t("registerNow")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
