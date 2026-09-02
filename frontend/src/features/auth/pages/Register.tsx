import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerApi } from "../authApi";
import type { RegisterPayload } from "../types";
import { useLanguage } from "../../../core/context/LanguageContext";
import LanguageSwitcher from "../../../sharedComponent/LanguageSwitcher";

import registerImage from "../../../assets/images/register.png";
import logoImage from "../../../assets/images/logo.png";

import "./Login.css";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // ==========================================
  // FORM STATE
  // ==========================================

  const [form, setForm] = useState<RegisterPayload>({
    fullName: "",
    name: "",
    email: "",
    password: "",
    agreeTerms: false,
  });

  // ==========================================
  // PROFILE IMAGE
  // ==========================================

  const [profileImage, setProfileImage] = useState<File | null>(null);

  const [profilePreview, setProfilePreview] = useState<string>("");

  // ==========================================
  // CONFIRM PASSWORD
  // ==========================================

  const [confirmPassword, setConfirmPassword] = useState("");

  // ==========================================
  // PASSWORD VISIBILITY
  // ==========================================

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==========================================
  // STATUS
  // ==========================================

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,

      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ==========================================
  // PROFILE IMAGE CHANGE
  // ==========================================

  const handleProfileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be less than 5 MB.");
      return;
    }

    setError("");

    setProfileImage(file);

    const previewUrl = URL.createObjectURL(file);

    setProfilePreview(previewUrl);
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Username is required.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      setLoading(true);

      // ==========================================
      // CREATE FORMDATA
      // ==========================================

      const formData = new FormData();

      formData.append("fullName", form.fullName);

      formData.append("name", form.name);

      formData.append("email", form.email);

      formData.append("password", form.password);

      formData.append("agreeTerms", String(form.agreeTerms));

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      // ==========================================
      // REGISTER
      // ==========================================

      await registerApi(formData);

      navigate("/login");
    } catch (err: any) {
      console.error("Registration failed:", err);

      setError(
        err?.response?.data?.message ||
          "Registration failed. Please try again.",
      );
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
        {/* ======================================
            LEFT SIDE
        ====================================== */}

        <div className="col-lg-6 left-side">
          <div className="brand-mark">
            <span>
              <img src={logoImage} className="logo" alt="VaadSamvaad" />
            </span>

            <span>
              <span className="vaad">Vaad</span>
              <span className="samvaad">Samvaad</span>
            </span>
          </div>

          <h1 className="hero-title">
            {t("joinConversation")} <span className="accent">{t("conversation")}</span>
          </h1>

          <p className="hero-copy">{t("registerHero")}</p>

          <div className="illustration-wrap">
            <img src={registerImage} alt="Register" />
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

        {/* ======================================
            RIGHT SIDE
        ====================================== */}

        <div className="col-lg-6 right-side">
          <h2 className="form-title">
            {t("createYour")} <span className="accent">{t("account")}</span>
          </h2>

          <p className="form-sub">{t("signUpSub")}</p>

          <form onSubmit={submit}>
            {/* ==================================
                PROFILE IMAGE
            ================================== */}

            <div className="mb-4 text-center">
              <label className="field-label d-block mb-2">{t("profileImage")}</label>

              <div className="mb-3">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile Preview"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #0d4930",
                    }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center mx-auto"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      background: "#f1f3f5",
                      border: "2px dashed #adb5bd",
                      fontSize: "38px",
                      color: "#6c757d",
                    }}
                  >
                    <i className="bi bi-person"></i>
                  </div>
                )}
              </div>

              <input
                type="file"
                className="form-control"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleProfileImage}
              />

              <small className="text-muted">
                JPG, PNG or WebP. Maximum size 5 MB.
              </small>
            </div>

            {/* ==================================
                FULL NAME
            ================================== */}

            <div className="mb-3">
              <label className="field-label">{t("fullName")}</label>

              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-person"></i>
                </span>

                <input
                  type="text"
                  name="fullName"
                  className="form-control"
                  placeholder={t("enterFullName")}
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ==================================
                EMAIL
            ================================== */}

            <div className="mb-3">
              <label className="field-label">{t("emailAddress")}</label>

              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>

                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder={t("enterEmail")}
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ==================================
                USERNAME
            ================================== */}

            <div className="mb-3">
              <label className="field-label">{t("username")}</label>

              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-at"></i>
                </span>

                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder={t("chooseUsername")}
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ==================================
                PASSWORD
            ================================== */}

            <div className="mb-3">
              <label className="field-label">{t("password")}</label>

              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control"
                  placeholder={t("createPassword")}
                  value={form.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i
                    className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}
                  ></i>
                </button>
              </div>
            </div>

            {/* ==================================
                CONFIRM PASSWORD
            ================================== */}

            <div className="mb-3">
              <label className="field-label">{t("confirmPassword")}</label>

              <div className="input-group input-group-custom px-2">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  placeholder={t("confirmYourPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i
                    className={
                      showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"
                    }
                  ></i>
                </button>
              </div>
            </div>

            {/* ==================================
                TERMS
            ================================== */}

            <div className="form-check mb-4 mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
              />

              <label className="form-check-label">
                I agree to the{" "}
                <a
                  href="#"
                  data-bs-toggle="modal"
                  data-bs-target="#termsModal"
                  onClick={(e) => e.preventDefault()}
                >
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  data-bs-toggle="modal"
                  data-bs-target="#privacyModal"
                  onClick={(e) => e.preventDefault()}
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* ==================================
                ERROR
            ================================== */}

            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}

            {/* ==================================
                REGISTER BUTTON
            ================================== */}

            <button
              type="submit"
              className="btn-login w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                  ></span>
                  {t("registering")}
                </>
              ) : (
                <>
                  {t("register")}
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* ==========================================
    TERMS & CONDITIONS MODAL
========================================== */}

          <div
            className="modal fade"
            id="termsModal"
            tabIndex={-1}
            aria-labelledby="termsModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="termsModalLabel">
                    Terms &amp; Conditions
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body" style={{ fontSize: "13px" }}>
                  <p>
                    The information on this website is for educational and
                    community discussion purposes only and does not constitute
                    formal legal advice. You retain full ownership of the
                    original text, opinions, and articles you write and submit
                    to the website.
                  </p>
                  <ul>
                    <li>
                      By posting, you grant us a royalty-free license to
                      display, share, host, and keep your content live on our
                      website and social media channels.
                    </li>
                    <li>
                      You promise that what you post is your own original work
                      and does not violate the copyright or intellectual
                      property rights or personal right of any third party.
                    </li>
                    <li>
                      You are solely responsible for the opinions and content
                      you upload, and the website owners are not liable for the
                      consequences of user-submitted opinions.
                    </li>
                    <li>
                      We love open expression in any language, but you strictly
                      agree not to post harassment, discrimination, hate speech,
                      or abusive language targeting individuals or groups.
                    </li>
                    <li>
                      You agree not to post any misinformation, defamatory
                      statements, or fraudulent content. You agree to not post
                      any material, which is personal about people or
                      organizations.
                    </li>
                    <li>
                      You agree not to post graphic violence, explicit adult
                      content, pornography, or any material that breaks local or
                      international laws.
                    </li>
                    <li>
                      You agree not to post commercial spam, unauthorized
                      advertisements, promotional links, or malicious software
                      and viruses.
                    </li>
                    <li>
                      We reserve the right to monitor, edit, or permanently
                      delete any post or comment that violates these rules or
                      compromises site safety without prior notice.
                    </li>
                    <li>
                      We reserve the right to suspend or permanently block
                      accounts of users who repeatedly break the rules or
                      disrupt the community.
                    </li>
                    <li>
                      Excluding user posts, all website designs, logos,
                      graphics, and articles authored by the founders are our
                      exclusive intellectual property and cannot be copied
                      without permission.
                    </li>
                    <li>
                      The website is provided on an "as-is" basis, and we do not
                      guarantee uninterrupted access or the complete accuracy of
                      all user-generated text.
                    </li>
                    <li>
                      Any legal actions or disputes arising from the use of this
                      website shall be governed by and handled exclusively under
                      the laws of [Insert Country/State, e.g., India / Delhi].
                    </li>
                  </ul>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
    PRIVACY POLICY MODAL
========================================== */}

          {/* ==========================================
    PRIVACY POLICY MODAL
========================================== */}

          <div
            className="modal fade"
            id="privacyModal"
            tabIndex={-1}
            aria-labelledby="privacyModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
              <div className="modal-content">
                {/* HEADER */}

                <div className="modal-header">
                  <h5 className="modal-title" id="privacyModalLabel">
                    Privacy Policy
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>

                {/* BODY */}

                <div className="modal-body" style={{ fontSize: "13px" }}>
                  <div className="accordion" id="privacyAccordion">
                    {/* =====================================
              1. INFORMATION WE COLLECT
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingOne">
                        <button
                          className="accordion-button"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseOne"
                          aria-expanded="true"
                          aria-controls="privacyCollapseOne"
                        >
                          1. Information We Collect
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseOne"
                        className="accordion-collapse collapse show"
                        aria-labelledby="privacyHeadingOne"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p>
                            We collect personal data that you voluntarily
                            provide to us when you register an account, fill out
                            contact forms, or submit articles and comments,
                            including your name, email address, and username.
                          </p>

                          <p className="mb-0">
                            We automatically collect certain technical
                            information when you navigate our platform, such as
                            your IP address, browser type, device identifiers,
                            and website usage statistics through cookies and
                            tracking technologies.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =====================================
              2. HOW WE USE YOUR INFORMATION
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingTwo">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseTwo"
                          aria-expanded="false"
                          aria-controls="privacyCollapseTwo"
                        >
                          2. How We Use Your Information
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseTwo"
                        className="accordion-collapse collapse"
                        aria-labelledby="privacyHeadingTwo"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p className="mb-0">
                            Your email address and personal credentials are used
                            strictly for account authentication, responding to
                            your inquiries, delivering site updates, and
                            managing your submissions to the platform.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =====================================
              3. DATA SHARING
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingThree">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseThree"
                          aria-expanded="false"
                          aria-controls="privacyCollapseThree"
                        >
                          3. Sharing of Personal Information
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseThree"
                        className="accordion-collapse collapse"
                        aria-labelledby="privacyHeadingThree"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p>
                            We do not sell, rent, trade, or commercially exploit
                            your personal data or contact information with
                            third-party advertisers or external corporate
                            entities.
                          </p>

                          <p className="mb-0">
                            We may share your data with trusted third-party
                            service providers who assist us in hosting our
                            website, analyzing traffic, or managing email
                            communications, under strict confidentiality
                            agreements.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =====================================
              4. PUBLIC INFORMATION
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingFour">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseFour"
                          aria-expanded="false"
                          aria-controls="privacyCollapseFour"
                        >
                          4. Publicly Visible Information
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseFour"
                        className="accordion-collapse collapse"
                        aria-labelledby="privacyHeadingFour"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p className="mb-0">
                            Any information, opinions, or comments you choose to
                            publish publicly on our platform will be visible to
                            the general public. Users are advised not to share
                            sensitive private information in public discussions.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =====================================
              5. DATA SECURITY
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingFive">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseFive"
                          aria-expanded="false"
                          aria-controls="privacyCollapseFive"
                        >
                          5. Data Security
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseFive"
                        className="accordion-collapse collapse"
                        aria-labelledby="privacyHeadingFive"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p className="mb-0">
                            We implement reasonable administrative and technical
                            security measures to safeguard your personal data
                            against unauthorized access, loss, alteration, or
                            disclosure.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =====================================
              6. DATA RETENTION
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingSix">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseSix"
                          aria-expanded="false"
                          aria-controls="privacyCollapseSix"
                        >
                          6. Data Retention
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseSix"
                        className="accordion-collapse collapse"
                        aria-labelledby="privacyHeadingSix"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p className="mb-0">
                            We will retain your personal information only for as
                            long as your account remains active or as required
                            to fulfill operational and legal obligations of the
                            platform.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =====================================
              7. USER RIGHTS
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingSeven">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseSeven"
                          aria-expanded="false"
                          aria-controls="privacyCollapseSeven"
                        >
                          7. Your Rights
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseSeven"
                        className="accordion-collapse collapse"
                        aria-labelledby="privacyHeadingSeven"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p className="mb-0">
                            You may request access, correction, updating, or
                            deletion of your personal account information by
                            contacting the platform administration, subject to
                            applicable legal requirements.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =====================================
              8. LEGAL DISCLOSURE
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingEight">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseEight"
                          aria-expanded="false"
                          aria-controls="privacyCollapseEight"
                        >
                          8. Legal Disclosure
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseEight"
                        className="accordion-collapse collapse"
                        aria-labelledby="privacyHeadingEight"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p className="mb-0">
                            We may disclose personal information if required by
                            applicable law, court order, or a valid request from
                            legal or regulatory authorities.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =====================================
              9. THIRD-PARTY LINKS
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingNine">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseNine"
                          aria-expanded="false"
                          aria-controls="privacyCollapseNine"
                        >
                          9. Third-Party Links
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseNine"
                        className="accordion-collapse collapse"
                        aria-labelledby="privacyHeadingNine"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p className="mb-0">
                            Our website may contain links to external websites.
                            We are not responsible for the privacy practices,
                            content, or data collection methods of those
                            external platforms.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* =====================================
              10. PRIVACY POLICY CHANGES
          ===================================== */}

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="privacyHeadingTen">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#privacyCollapseTen"
                          aria-expanded="false"
                          aria-controls="privacyCollapseTen"
                        >
                          10. Changes to This Privacy Policy
                        </button>
                      </h2>

                      <div
                        id="privacyCollapseTen"
                        className="accordion-collapse collapse"
                        aria-labelledby="privacyHeadingTen"
                        data-bs-parent="#privacyAccordion"
                      >
                        <div className="accordion-body">
                          <p className="mb-0">
                            This Privacy Policy may be updated from time to time
                            to reflect changes in our data practices, platform
                            functionality, or applicable laws and regulations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="login-line">
            {t("alreadyAccount")} <Link to="/login">{t("loginNow")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
