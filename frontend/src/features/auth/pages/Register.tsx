// features/auth/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../authApi";
import type { RegisterPayload } from "../types";
import registerImage from "../../../assets/images/register.png";
import logoImage from "../../../assets/images/logo.png";
import "./Login.css";

export default function Register() {
  const [form, setForm] = useState<RegisterPayload>({
    fullName: "",
    name: "",
    email: "",
    password: "",
    agreeTerms: false,
  });

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    await registerApi(form);
    navigate("/login");
  };

  return (
    <div className="shell">
      <div className="auth-panel row g-0">
        <div className="col-lg-6 left-side">
          <div className="brand-mark">
            <span>
              <img src={logoImage} className="logo" />
            </span>
            <span>
              <span className="vaad">Vaad</span>
              <span className="samvaad">Samvaad</span>
            </span>
          </div>

          <h1 className="hero-title">
            Join the <span className="accent">Conversation!</span>
          </h1>
          <p className="hero-copy">
            Create an account and start sharing your views with the community.
          </p>

          <div className="illustration-wrap">
            <img src={registerImage} />
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

        <div className="col-lg-6 right-side">
          <h2 className="form-title">
            Create Your <span className="accent">Account</span>
          </h2>
          <p className="form-sub">
            Sign up to VaadSamvaad and be a part of meaningful discussions.
          </p>

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="field-label">Full Name</label>
              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  name="fullName"
                  className="form-control"
                  placeholder="Enter your full name"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="field-label">Email Address</label>
              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter your email"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="field-label">Username</label>
              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-at"></i>
                </span>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Choose a username"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="field-label">Password</label>
              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Create a password"
                  onChange={handleChange}
                />
                <button type="button" className="toggle-eye">
                  <i className="bi bi-eye" id="eyeIcon1"></i>
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="field-label">Confirm Password</label>
              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Confirm your password"
                  onChange={handleChange}
                />
                <button type="button" className="toggle-eye">
                  <i className="bi bi-eye" id="eyeIcon2"></i>
                </button>
              </div>
            </div>

            <div className="form-check mb-4 mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                name="agreeTerms"
                onChange={handleChange}
              />
              <label className="form-check-label">
                I agree to the <a href="#">Terms of Service</a> and{" "}
                <a href="#">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              className="btn-login w-100 d-flex align-items-center justify-content-center gap-2"
            >
              Register <i className="bi bi-arrow-right"></i>
            </button>
          </form>

          <p className="login-line">
            Already have an account? <Link to="/login">Register now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
