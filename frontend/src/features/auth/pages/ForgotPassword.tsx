import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { forgotPasswordApi } from "../authApi";
import { useLanguage } from "../../../core/context/LanguageContext";
import LanguageSwitcher from "../../../sharedComponent/LanguageSwitcher";
import WhyJoinFeatures from "../../../sharedComponent/WhyJoinFeatures";
import logoImage from "../../../assets/images/logo.png";
import loginImage from "../../../assets/images/login.png";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await forgotPasswordApi({ email: email.trim() });
      const resetToken = response.data.resetToken;

      if (resetToken) {
        navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`);
        return;
      }

      setMessage(response.data.message || t("resetEmailSent"));
    } catch (err: any) {
      setError(err.response?.data?.message || t("forgotPasswordFailed"));
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
          <h1 className="hero-title">{t("forgotPasswordTitle")}</h1>
          <p className="hero-copy">{t("forgotPasswordIntro")}</p>
          <div className="illustration-wrap">
            <img src={loginImage} alt="" />
          </div>
        </div>

        <div className="col-lg-6 right-side">
          <h2 className="login-title">{t("forgotPassword")}</h2>
          <p className="login-sub">{t("forgotPasswordIntro")}</p>

          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="field-label">{t("emailAddress")}</label>
              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("enterEmail")}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-login w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? t("sending") : t("continueReset")}
              <i className="bi bi-arrow-right"></i>
            </button>
          </form>

          <p className="register-line">
            <Link to="/login">{t("backToLogin")}</Link>
          </p>
        </div>
      </div>
      <WhyJoinFeatures />
    </div>
  );
}
