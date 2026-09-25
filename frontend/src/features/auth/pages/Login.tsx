import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginApi } from "../authApi";
import { useAuth } from "../../../core/context/AuthContext";
import { useLanguage } from "../../../core/context/LanguageContext";
import type { LoginPayload } from "../types";
import loginImage from "../../../assets/images/login.png";
import logoImage from "../../../assets/images/logo.png";
import LanguageSwitcher from "../../../sharedComponent/LanguageSwitcher";
import SocialLoginButtons from "../../../sharedComponent/SocialLoginButtons";
import WhyJoinFeatures from "../../../sharedComponent/WhyJoinFeatures";
import {
  AUTH_RETURN_TO_KEY,
  getSafeReturnPath,
} from "../../../core/utils/authReturn";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });

  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => searchParams.get("error") || "");

  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const isParticipateMode = searchParams.get("mode") === "participate";
  const returnTo =
    getSafeReturnPath(searchParams.get("next")) ||
    getSafeReturnPath(sessionStorage.getItem(AUTH_RETURN_TO_KEY));

  useEffect(() => {
    const nextPath = getSafeReturnPath(searchParams.get("next"));
    if (nextPath) {
      sessionStorage.setItem(AUTH_RETURN_TO_KEY, nextPath);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isParticipateMode) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await loginApi(form);

      login(res.data.token, res.data.user);

      const nextPath =
        getSafeReturnPath(sessionStorage.getItem(AUTH_RETURN_TO_KEY)) ||
        "/discussion";
      sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
      navigate(nextPath);
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

          <h1 className="hero-title">
            {isParticipateMode ? (
              <>
                {t("participateLoginTitle")}{" "}
                <span className="accent">{t("participate")}</span>
              </>
            ) : (
              <>
                {t("welcomeBack")} <span className="accent">{t("back")}</span>
              </>
            )}
          </h1>

          <p className="hero-copy">
            {isParticipateMode ? t("participateLoginHero") : t("loginHero")}
          </p>

          <div className="illustration-wrap">
            <img src={loginImage} alt="Login illustration" />
          </div>
        </div>

        <div className="col-lg-6 right-side">
          <h2 className="login-title">
            {isParticipateMode ? (
              <>
                {t("participateToContinue")}{" "}
                <span className="accent">Amarsa Vimarsa</span>
              </>
            ) : (
              <>
                {t("loginToVaad")} <span className="accent">Amarsa Vimarsa</span>
              </>
            )}
          </h2>

          <p className="login-sub">
            {isParticipateMode
              ? t("participateLoginSub")
              : t("welcomeEnterDetails")}
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {!isParticipateMode ? (
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
                <div className="forgot-password-row">
                  <Link to="/forgot-password">{t("forgotPassword")}</Link>
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
          ) : null}

          <SocialLoginButtons
            hideDivider={isParticipateMode}
            returnTo={returnTo || undefined}
          />

          {!isParticipateMode ? (
            <p className="register-line">
              {t("noAccount")} <Link to="/register">{t("registerNow")}</Link>
            </p>
          ) : null}
        </div>
      </div>
      <WhyJoinFeatures />
    </div>
  );
}
