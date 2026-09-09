import { API_URL } from "../core/config/env";
import { useLanguage } from "../core/context/LanguageContext";

export default function SocialLoginButtons() {
  const { t } = useLanguage();

  const startSocialLogin = (provider: "google" | "facebook") => {
    const redirect = encodeURIComponent(window.location.origin);
    window.location.href = `${API_URL}/auth/${provider}?redirect=${redirect}`;
  };

  return (
    <div className="social-login">
      <p className="social-login-divider">
        <span>{t("orContinueWith")}</span>
      </p>
      <button
        type="button"
        className="btn-social btn-social-google"
        onClick={() => startSocialLogin("google")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
          />
          <path
            fill="#34A853"
            d="M6.6 14.3l-.8.6-2.8 2.2C4.6 20.2 8 22 12 22c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 .9-3.6.9-2.7 0-5-1.8-5.8-4.3z"
          />
          <path
            fill="#4A90E2"
            d="M3 7.1C2.4 8.3 2 9.6 2 11s.4 2.7 1 3.9c0 0 3.6-2.8 3.6-2.8C6.4 11.4 6.3 10.7 6.3 10c0-.7.1-1.4.3-2.1L3 7.1z"
          />
          <path
            fill="#FBBC05"
            d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.6 2 12 2 8 2 4.6 3.8 3 7.1l3.6 2.8C7 7.4 9.3 5.9 12 5.9z"
          />
        </svg>
        {t("continueWithGoogle")}
      </button>
      <button
        type="button"
        className="btn-social btn-social-facebook"
        onClick={() => startSocialLogin("facebook")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#1877F2"
            d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.27h3.34l-.53 3.49h-2.81V24C19.61 23.09 24 18.1 24 12.07z"
          />
        </svg>
        {t("continueWithFacebook")}
      </button>
    </div>
  );
}
