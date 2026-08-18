// features/auth/pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../authApi";
import { useAuth } from "../../../core/context/AuthContext";
import type { LoginPayload } from "../types";
import loginImage from "../../../assets/images/login.png";
import logoImage from "../../../assets/images/logo.png";
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

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
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
            Welcome <span className="accent">Back!</span>
          </h1>

          <p className="hero-copy">
            Login to continue your discussions and share your views with the
            community.
          </p>

          <div className="illustration-wrap">
            <img src={loginImage} alt="Login illustration" />
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">
                <i className="bi bi-chat-dots"></i>
              </span>

              <div>
                <div className="feature-title">Meaningful Discussions</div>
                <div className="feature-desc">
                  Engage in conversations that matter.
                </div>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">
                <i className="bi bi-megaphone"></i>
              </span>

              <div>
                <div className="feature-title">Share Your Views</div>
                <div className="feature-desc">
                  Express your opinions and learn from others.
                </div>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">
                <i className="bi bi-people"></i>
              </span>

              <div>
                <div className="feature-title">Build Community</div>
                <div className="feature-desc">
                  Connect with like-minded people.
                </div>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">
                <i className="bi bi-shield-check"></i>
              </span>

              <div>
                <div className="feature-title">Safe &amp; Respectful</div>
                <div className="feature-desc">
                  A positive environment for healthy discussions.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login form */}
        <div className="col-lg-6 right-side">
          <h2 className="login-title">
            Login to <span className="accent">VaadSamvaad</span>
          </h2>

          <p className="login-sub">Welcome back! Please enter your details.</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="field-label" for="email">
                Email Address
              </label>
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
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="field-label" for="email">
                Password
              </label>
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
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-login w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
              <i className="bi bi-arrow-right"></i>
            </button>
          </form>

          <p className="register-line">
            Don't have an account? <Link to="/register">Register now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
