import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { getMeApi } from "../authApi";
import { useAuth } from "../../../core/context/AuthContext";
import { useLanguage } from "../../../core/context/LanguageContext";
import {
  AUTH_RETURN_TO_KEY,
  getSafeReturnPath,
} from "../../../core/utils/authReturn";
import "./Login.css";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      setError(t("oauthFailed"));
      return;
    }

    let cancelled = false;

    const completeLogin = async () => {
      try {
        localStorage.setItem("token", token);
        const res = await getMeApi();

        if (cancelled) {
          return;
        }

        login(token, res.data.user);

        const nextPath =
          getSafeReturnPath(sessionStorage.getItem(AUTH_RETURN_TO_KEY)) ||
          "/discussion";
        sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
        navigate(nextPath, { replace: true });
      } catch {
        if (!cancelled) {
          setError(t("oauthFailed"));
        }
      }
    };

    void completeLogin();

    return () => {
      cancelled = true;
    };
  }, [login, navigate, params, t]);

  return (
    <div className="shell oauth-callback">
      <div className="oauth-callback-card">
        {error ? (
          <>
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
            <Link to="/login">{t("backToLogin")}</Link>
          </>
        ) : (
          <p>{t("completingSignIn")}</p>
        )}
      </div>
    </div>
  );
}
