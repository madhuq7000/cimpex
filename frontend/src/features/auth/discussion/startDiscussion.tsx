import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";

interface Category {
  _id: string;
  name: string;
}

interface Discussion {
  _id: string;
  title: string;
  description: string;
  category?: {
    _id: string;
    name: string;
  };
  image?: string;
}

const SERVER_URL = "http://localhost:3000";
const API_URL = `${SERVER_URL}/api`;

const StartDiscussion: React.FC = () => {
  const navigate = useNavigate();

  // ==========================================
  // GET DISCUSSION ID
  // ==========================================

  const { id } = useParams<{ id: string }>();

  const isEditMode = Boolean(id);

  // ==========================================
  // FORM STATES
  // ==========================================

  const [title, setTitle] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [image, setImage] = useState<File | null>(null);

  // Existing image coming from database
  const [existingImage, setExistingImage] = useState<string>("");

  // Used when user removes existing image
  const [removeExistingImage, setRemoveExistingImage] =
    useState<boolean>(false);

  // ==========================================
  // CATEGORY STATES
  // ==========================================

  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryLoading, setCategoryLoading] = useState<boolean>(true);

  // ==========================================
  // PAGE STATES
  // ==========================================

  const [loading, setLoading] = useState<boolean>(false);

  const [pageLoading, setPageLoading] = useState<boolean>(false);

  const [error, setError] = useState<string>("");

  const [success, setSuccess] = useState<string>("");

  // ==========================================
  // TIPTAP EDITOR
  // ==========================================

  const editor = useEditor({
    extensions: [
      StarterKit,

      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
    ],

    content: "",

    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },

    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      setDescription(html);
    },
  });

  // ==========================================
  // GET CATEGORIES
  // ==========================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);

        const response = await axios.get(`${API_URL}/categories`);

        console.log("Category API response:", response.data);

        setCategories(response.data.data || []);
      } catch (error: any) {
        console.error("Failed to load categories:", error);

        setError(error.response?.data?.message || "Failed to load categories.");
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ==========================================
  // GET DISCUSSION FOR EDIT
  // ==========================================

  useEffect(() => {
    if (!isEditMode || !id || !editor) {
      return;
    }

    const fetchDiscussion = async () => {
      try {
        setPageLoading(true);

        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError("You are not logged in. Please login first.");

          return;
        }

        console.log("Fetching discussion for edit:", id);

        const response = await axios.get(`${API_URL}/discussions/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Discussion API response:", response.data);

        const discussion: Discussion = response.data.data;

        if (!discussion) {
          setError("Discussion not found.");

          return;
        }

        // ======================================
        // PATCH DATABASE DATA
        // ======================================

        setTitle(discussion.title || "");

        setCategoryId(discussion.category?._id || "");

        setExistingImage(discussion.image || "");

        setRemoveExistingImage(false);

        const discussionDescription = discussion.description || "";

        setDescription(discussionDescription);

        // ======================================
        // PATCH TIPTAP EDITOR
        // ======================================

        editor.commands.setContent(discussionDescription);

        console.log("Form patched with discussion data");
      } catch (error: any) {
        console.error("Failed to fetch discussion:", error);

        if (error.response?.status === 401) {
          setError("Unauthorized. Please login again.");
        } else if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else {
          setError("Failed to load discussion.");
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchDiscussion();
  }, [id, isEditMode, editor]);

  // ==========================================
  // FILE CHANGE
  // ==========================================

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // ======================================
    // CHECK FILE SIZE
    // ======================================

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");

      event.target.value = "";

      return;
    }

    // ======================================
    // CHECK FILE TYPE
    // ======================================

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and GIF images are allowed.");

      event.target.value = "";

      return;
    }

    setError("");

    setImage(file);

    // User selected another image
    setRemoveExistingImage(false);
  };

  // ==========================================
  // REMOVE NEW IMAGE
  // ==========================================

  const handleRemoveImage = () => {
    setImage(null);

    const fileInput = document.getElementById(
      "fileInput",
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ==========================================
  // REMOVE EXISTING IMAGE
  // ==========================================

  const handleRemoveExistingImage = () => {
    setExistingImage("");

    setRemoveExistingImage(true);
  };

  // ==========================================
  // SET LINK
  // ==========================================

  const handleSetLink = () => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href || "";

    const url = window.prompt("Enter URL:", previousUrl);

    // User cancelled
    if (url === null) {
      return;
    }

    // Empty URL means remove existing link
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    let finalUrl = url.trim();

    // Add https:// automatically
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: finalUrl,
      })
      .run();
  };

  // ==========================================
  // ADD EMOJI
  // ==========================================

  const handleEmoji = () => {
    if (!editor) {
      return;
    }

    const emoji = window.prompt("Enter emoji:", "😊");

    if (!emoji) {
      return;
    }

    editor.chain().focus().insertContent(emoji).run();
  };

  // ==========================================
  // REMOVE LINK
  // ==========================================

  const handleRemoveLink = () => {
    if (!editor) {
      return;
    }

    editor.chain().focus().unsetLink().run();
  };

  // ==========================================
  // GET PLAIN TEXT LENGTH
  // ==========================================

  const descriptionLength = editor?.getText().length || 0;

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    setSuccess("");

    // ========================================
    // VALIDATION
    // ========================================

    if (!title.trim()) {
      setError("Discussion title is required.");

      return;
    }

    if (!categoryId) {
      setError("Please select a category.");

      return;
    }

    // Validate actual editor text
    const plainText = editor?.getText().trim() || "";

    if (!plainText) {
      setError("Discussion description is required.");

      return;
    }

    if (plainText.length > 5000) {
      setError("Discussion description cannot exceed 5000 characters.");

      return;
    }

    try {
      setLoading(true);

      // ========================================
      // GET TOKEN
      // ========================================

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in. Please login first.");

        return;
      }

      // ========================================
      // CREATE FORMDATA
      // ========================================

      const formData = new FormData();

      formData.append("title", title.trim());

      // Save TipTap HTML
      const editorHtml = editor?.getHTML() || "";

      formData.append("description", editorHtml);

      formData.append("categoryId", categoryId);

      // ========================================
      // NEW IMAGE
      // ========================================

      if (image) {
        formData.append("image", image);
      }

      // ========================================
      // REMOVE OLD IMAGE
      // ========================================

      if (removeExistingImage) {
        formData.append("removeImage", "true");
      }

      // ========================================
      // DEBUG
      // ========================================

      console.log("================================");

      console.log(isEditMode ? "UPDATING DISCUSSION" : "CREATING DISCUSSION");

      console.log("ID:", id);

      console.log("Title:", title.trim());

      console.log("Category ID:", categoryId);

      console.log("Description HTML:", editorHtml);

      console.log("Description text:", plainText);

      console.log("New Image:", image);

      console.log("Remove Existing Image:", removeExistingImage);

      console.log("================================");

      // ========================================
      // EDIT DISCUSSION
      // ========================================

      if (isEditMode && id) {
        const response = await axios.put(
          `${API_URL}/discussions/${id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("Update discussion response:", response.data);

        setSuccess("Discussion updated successfully!");

        setTimeout(() => {
          navigate(`/discussion/${id}`);
        }, 800);

        return;
      }

      // ========================================
      // CREATE DISCUSSION
      // ========================================

      const response = await axios.post(`${API_URL}/discussions`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Create discussion response:", response.data);

      setSuccess("Discussion started successfully!");

      // ========================================
      // CREATED DISCUSSION ID
      // ========================================

      const discussionId = response.data?.data?._id;

      // ========================================
      // REDIRECT
      // ========================================

      if (discussionId) {
        setTimeout(() => {
          navigate(`/discussion/${discussionId}`);
        }, 800);
      } else {
        setTimeout(() => {
          navigate("/discussion");
        }, 800);
      }
    } catch (error: any) {
      console.error("Discussion submit error:", error);

      console.error("API error:", error.response?.data);

      if (error.response?.status === 401) {
        setError("Unauthorized. Please login again.");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(
          isEditMode
            ? "Failed to update discussion."
            : "Failed to start discussion.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    if (isEditMode && id) {
      navigate(`/discussion/${id}`);
    } else {
      navigate("/discussion");
    }
  };

  // ==========================================
  // PAGE LOADING
  // ==========================================

  if (pageLoading) {
    return (
      <main className="col-lg-9 col-xl-10 main-wrap">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>

          <p className="text-muted mt-3">Loading discussion...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // JSX
  // ==========================================

  return (
    <main className="col-lg-9 col-xl-10 main-wrap">
      {/* ======================================
          BREADCRUMB
      ====================================== */}

      <div className="breadcrumb-wrap mb-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();

            navigate("/");
          }}
        >
          Home
        </a>

        <span className="mx-1 text-muted">&gt;</span>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();

            navigate("/discussion");
          }}
        >
          Discussions
        </a>

        <span className="mx-1 text-muted">&gt;</span>

        <span className="current">
          {isEditMode ? "Edit Discussion" : "Start Discussion"}
        </span>
      </div>

      {/* ======================================
          TITLE
      ====================================== */}

      <h1 className="page-title mb-1">
        {isEditMode ? "Edit Discussion" : "Start a New Discussion"}
      </h1>

      <p className="page-subtitle mb-4">
        {isEditMode
          ? "Update your discussion details."
          : "Share your thoughts and start a meaningful conversation."}
      </p>

      {/* ERROR */}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* SUCCESS */}

      {success && <div className="alert alert-success">{success}</div>}

      {/* ======================================
          FORM
      ====================================== */}

      <form onSubmit={handleSubmit}>
        {/* ====================================
            TITLE
        ==================================== */}

        <div className="mb-4">
          <label className="field-label" htmlFor="title">
            Title
          </label>

          <input
            type="text"
            id="title"
            className="form-control"
            placeholder="Enter a catchy title for your discussion"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="char-count">
            <span>{title.length}</span>
            /100
          </div>
        </div>

        {/* ====================================
            CATEGORY
        ==================================== */}

        <div className="mb-4">
          <label className="field-label" htmlFor="category">
            Category
          </label>

          <select
            id="category"
            className="form-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={categoryLoading}
          >
            <option value="">
              {categoryLoading ? "Loading categories..." : "Select a category"}
            </option>

            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* ====================================
            DESCRIPTION
        ==================================== */}

        <div className="mb-4">
          <label className="field-label">Description</label>

          <div className="editor-wrap">
            {/* ================================
                TOOLBAR
            ================================ */}

            <div className="editor-toolbar">
              {/* BOLD */}

              <button
                type="button"
                className={`editor-tool ${
                  editor?.isActive("bold") ? "active" : ""
                }`}
                title="Bold"
                onClick={() => editor?.chain().focus().toggleBold().run()}
              >
                <i className="bi bi-type-bold"></i>
              </button>

              {/* ITALIC */}

              <button
                type="button"
                className={`editor-tool ${
                  editor?.isActive("italic") ? "active" : ""
                }`}
                title="Italic"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              >
                <i className="bi bi-type-italic"></i>
              </button>

              {/* BULLET LIST */}

              <button
                type="button"
                className={`editor-tool ${
                  editor?.isActive("bulletList") ? "active" : ""
                }`}
                title="Bullet List"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              >
                <i className="bi bi-list-ul"></i>
              </button>

              {/* QUOTE */}

              <button
                type="button"
                className={`editor-tool ${
                  editor?.isActive("blockquote") ? "active" : ""
                }`}
                title="Quote"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              >
                <i className="bi bi-quote"></i>
              </button>

              {/* LINK */}

              <button
                type="button"
                className={`editor-tool ${
                  editor?.isActive("link") ? "active" : ""
                }`}
                title="Add Link"
                onClick={handleSetLink}
              >
                <i className="bi bi-link-45deg"></i>
              </button>

              {/* REMOVE LINK */}

              {editor?.isActive("link") && (
                <button
                  type="button"
                  className="editor-tool"
                  title="Remove Link"
                  onClick={handleRemoveLink}
                >
                  <i className="bi bi-link-45deg"></i>
                  <span
                    style={{
                      fontSize: "10px",
                    }}
                  >
                    ×
                  </span>
                </button>
              )}

              {/* EMOJI */}

              <button
                type="button"
                className="editor-tool"
                title="Emoji"
                onClick={handleEmoji}
              >
                <i className="bi bi-emoji-smile"></i>
              </button>
            </div>

            {/* ================================
                EDITOR
            ================================ */}

            <div className="editor-body">
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="char-count">
            <span>{descriptionLength}</span>
            /5000
          </div>
        </div>

        {/* ====================================
            IMAGE
        ==================================== */}

        <div className="mb-4">
          <label className="field-label mb-2">
            Upload Image <span className="optional">(Optional)</span>
          </label>

          {/* EXISTING IMAGE */}

          {existingImage && !image && (
            <div className="mb-3">
              <div className="mb-2">
                <small className="text-muted">Current Image</small>
              </div>

              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                }}
              >
                <img
                  src={`${SERVER_URL}${existingImage}`}
                  alt="Current discussion"
                  style={{
                    width: "200px",
                    height: "130px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                  }}
                />

                <button
                  type="button"
                  className="btn btn-sm btn-danger ms-2"
                  onClick={handleRemoveExistingImage}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* UPLOAD */}

          <label
            htmlFor="fileInput"
            className="upload-box"
            style={{
              cursor: "pointer",
            }}
          >
            <i className="bi bi-cloud-arrow-up d-block mb-2"></i>

            <div>{image ? image.name : "Drag & drop an image here"}</div>

            {!image && (
              <>
                <div>
                  <span className="upload-link">or click to browse</span>
                </div>

                <div className="upload-hint mt-1">
                  Supports: JPG, PNG, GIF (Max 5MB)
                </div>
              </>
            )}

            <input
              type="file"
              id="fileInput"
              accept=".jpg,.jpeg,.png,.gif"
              className="d-none"
              onChange={handleFileChange}
            />
          </label>

          {/* NEW IMAGE */}

          {image && (
            <div className="mt-2">
              <small className="text-muted">Selected: {image.name}</small>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-2"
                onClick={handleRemoveImage}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* ====================================
            ACTION BUTTONS
        ==================================== */}

        <div className="d-flex justify-content-end gap-2 action-row">
          <button
            type="button"
            className="btn btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button type="submit" className="btn btn-brand" disabled={loading}>
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>

                {isEditMode ? "Updating..." : "Starting..."}
              </>
            ) : isEditMode ? (
              "Update Discussion"
            ) : (
              "Start Discussion"
            )}
          </button>
        </div>
      </form>
    </main>
  );
};

export default StartDiscussion;
