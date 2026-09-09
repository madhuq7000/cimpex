import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { resetPasswordApi } from "../authApi";
import { useLanguage } from "../../../core/context/LanguageContext";
import LanguageSwitcher from "../../../sharedComponent/LanguageSwitcher";
import WhyJoinFeatures from "../../../sharedComponent/WhyJoinFeatures";
import logoImage from "../../../assets/images/logo.png";
import loginImage from "../../../assets/images/login.png";
import "./Login.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError(t("invalidResetLink"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    try {
      setLoading(true);
      setError("");

      await resetPasswordApi({ token, password });
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || t("passwordResetFailed"));
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
        <div className="col-lg-6 left-side">
          <div className="brand-mark">
            <Link to="/discussion" className="brand-mark-link">
              <img src={logoImage} className="logo" alt="Amarsa Vimarsa Logo" />
              <span>
                <span className="vaad">Amarsa</span>
                <span className="samvaad"> Vimarsa</span>
              </span>
            </Link>
          </div>
          <h1 className="hero-title">{t("resetPassword")}</h1>
          <p className="hero-copy">{t("resetPasswordIntro")}</p>
          <div className="illustration-wrap">
            <img src={loginImage} alt="" />
          </div>
        </div>

        <div className="col-lg-6 right-side">
          <h2 className="login-title">{t("resetPassword")}</h2>
          <p className="login-sub">{t("resetPasswordIntro")}</p>

          {error && <div className="alert alert-danger">{error}</div>}

          {!token ? (
            <div className="alert alert-warning">{t("invalidResetLink")}</div>
          ) : (
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="field-label">{t("newPassword")}</label>
                <div className="input-group input-group-custom px-2">
                  <span className="input-group-text">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("createPassword")}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="field-label">{t("confirmNewPassword")}</label>
                <div className="input-group input-group-custom px-2">
                  <span className="input-group-text">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t("confirmYourPassword")}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-login w-100 d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                {loading ? t("updating") : t("resetPassword")}
                <i className="bi bi-arrow-right"></i>
              </button>
            </form>
          )}

          <p className="register-line">
            <Link to="/login">{t("backToLogin")}</Link>
          </p>
        </div>
      </div>
      <WhyJoinFeatures />
    </div>
  );
}
