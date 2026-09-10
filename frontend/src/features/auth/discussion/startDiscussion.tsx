import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { sanitizeDiscussionHtml } from "../../../core/utils/sanitizeDiscussionHtml";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ResizableImage from "./resizableImage";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";

import { API_URL } from "../../../core/config/env";
import { useLanguage } from "../../../core/context/LanguageContext";
import { getYoutubeVideoId } from "../../../core/utils/youtube";
import VideoSourceFields from "../../../sharedComponent/VideoSourceFields";
import ImageSourceFields from "../../../sharedComponent/ImageSourceFields";
import MediaAttachSelect, {
  type MediaAttachKind,
} from "../../../sharedComponent/MediaAttachSelect";

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
    video?: string;
    youtubeUrl?: string;
    document?: string;
    documentName?: string;
}

const MAX_DESCRIPTION_CHARS = 50000;

const StartDiscussion: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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

  const [video, setVideo] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState<string>("");
  const [removeExistingVideo, setRemoveExistingVideo] =
    useState<boolean>(false);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [existingYoutubeUrl, setExistingYoutubeUrl] = useState<string>("");
  const [removeExistingYoutube, setRemoveExistingYoutube] =
    useState<boolean>(false);

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [existingDocument, setExistingDocument] = useState<string>("");
  const [existingDocumentName, setExistingDocumentName] = useState<string>("");
  const [removeExistingDocument, setRemoveExistingDocument] =
    useState<boolean>(false);

  const [importingDocument, setImportingDocument] = useState<boolean>(false);

  const [mediaKind, setMediaKind] = useState<MediaAttachKind>("");

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

  const allowedDocumentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const allowedDocumentExtensions = [".pdf", ".doc", ".docx"];

  // ==========================================
  // TIPTAP EDITOR
  // ==========================================

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
        },
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "imported-doc-image",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      TableKit.configure({
        table: {
          resizable: false,
        },
      }),
    ],

    content: "",

    immediatelyRender: false,

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

  useEffect(() => {
    if (!video) {
      setVideoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(video);
    setVideoPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [video]);

  // ==========================================
  // GET DISCUSSION FOR EDIT
  // ==========================================

  useEffect(() => {
    if (!isEditMode || !id || !editor) {
      return;
    }

    const fetchDiscussion = async () => {
      try {
        setPageLoading(false);

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

        setExistingVideo(discussion.video || "");

        setRemoveExistingVideo(false);

        setExistingYoutubeUrl(discussion.youtubeUrl || "");

        setYoutubeUrl(discussion.youtubeUrl || "");

        setRemoveExistingYoutube(false);

        setVideo(null);

        if (discussion.image) {
          setMediaKind("image");
        } else if (discussion.video || discussion.youtubeUrl) {
          setMediaKind("video");
        } else if (discussion.document) {
          setMediaKind("document");
        } else {
          setMediaKind("");
        }

        setExistingDocument(discussion.document || "");
        setExistingDocumentName(discussion.documentName || "");
        setRemoveExistingDocument(false);

        const discussionDescription = discussion.description || "";

        setDescription(discussionDescription);

        // ======================================
        // PATCH TIPTAP EDITOR
        // ======================================

        editor.commands.setContent(
          sanitizeDiscussionHtml(discussionDescription),
        );

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
  // IMPORT DOCUMENT AND FILL FORM
  // ==========================================

  const handleDocumentChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;

    if (file.size > 50 * 1024 * 1024) {
      setError("Document size must be less than 50MB.");
      event.target.value = "";
      return;
    }

    const isAllowedType =
      allowedDocumentTypes.includes(file.type) ||
      allowedDocumentExtensions.includes(extension);

    if (!isAllowedType) {
      setError("Only PDF, DOC and DOCX files are allowed.");
      event.target.value = "";
      return;
    }

    try {
      setImportingDocument(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in. Please login first.");
        event.target.value = "";
        return;
      }

      const formData = new FormData();
      formData.append("document", file);

      const response = await axios.post(
        `${API_URL}/discussions/import-document`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const importedTitle = response.data?.data?.title || "";
      const importedDescription = response.data?.data?.description || "";

      setTitle(importedTitle.slice(0, 100));
      setDescription(importedDescription);
      setDocumentFile(file);
      setRemoveExistingDocument(false);

      if (editor) {
        editor.commands.setContent(sanitizeDiscussionHtml(importedDescription));
      }

      setSuccess(
        "Title and description were filled from your document. Review them, choose a category, then submit.",
      );
    } catch (importError: any) {
      console.error("Failed to import document:", importError);

      setDocumentFile(file);
      setRemoveExistingDocument(false);

      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 100));
      }

      if (importError.response?.status === 401) {
        setDocumentFile(null);
        setError("Unauthorized. Please login again.");
      } else {
        setError(
          importError.response?.data?.message ||
            "Could not read text from this document. The file is still attached — add a title and description, then submit.",
        );
      }

      event.target.value = "";
    } finally {
      setImportingDocument(false);
    }
  };

  const handleRemoveDocument = () => {
    setDocumentFile(null);

    const documentInput = document.getElementById(
      "documentInput",
    ) as HTMLInputElement | null;

    if (documentInput) {
      documentInput.value = "";
    }
  };

  const handleRemoveExistingImage = () => {
    setExistingImage("");

    setRemoveExistingImage(true);
  };

  const handleVideoFileChange = (file: File | null) => {
    setError("");
    setVideo(file);

    if (file) {
      setYoutubeUrl("");
      setExistingYoutubeUrl("");
      setRemoveExistingYoutube(true);
      setRemoveExistingVideo(false);
    }
  };

  const handleYoutubeUrlChange = (value: string) => {
    setYoutubeUrl(value);
    setRemoveExistingYoutube(!value.trim());

    if (value.trim()) {
      setVideo(null);
      setRemoveExistingVideo(Boolean(existingVideo));
    }
  };

  const handleRemoveExistingVideo = () => {
    setExistingVideo("");
    setRemoveExistingVideo(true);
  };

  const handleRemoveExistingYoutube = () => {
    setExistingYoutubeUrl("");
    setYoutubeUrl("");
    setRemoveExistingYoutube(true);
  };

  const handleMediaKindChange = (nextKind: MediaAttachKind) => {
    setMediaKind(nextKind);
    setError("");

    if (nextKind !== "image") {
      setImage(null);

      if (existingImage) {
        setExistingImage("");
        setRemoveExistingImage(true);
      }
    }

    if (nextKind !== "video") {
      setVideo(null);
      setYoutubeUrl("");

      if (existingVideo) {
        setExistingVideo("");
        setRemoveExistingVideo(true);
      }

      if (existingYoutubeUrl) {
        setExistingYoutubeUrl("");
        setRemoveExistingYoutube(true);
      }
    }

    if (nextKind !== "document") {
      handleRemoveDocument();

      if (existingDocument) {
        setExistingDocument("");
        setExistingDocumentName("");
        setRemoveExistingDocument(true);
      }
    }
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
    event.stopPropagation();

    const showFormError = (message: string) => {
      setError(message);
      window.setTimeout(() => {
        document
          .getElementById("discussion-form-error")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    };

    setError("");
    setSuccess("");

    try {
      if (!title.trim()) {
        showFormError("Discussion title is required.");
        return;
      }

      if (!categoryId) {
        showFormError("Please select a category.");
        return;
      }

      let plainText = "";
      let html = description || "";

      try {
        plainText = editor?.getText().trim() || "";
        html = editor?.getHTML() || html;
      } catch (editorError) {
        console.error("Could not read editor content:", editorError);
        plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }

      const hasInlineImages = /<img\s/i.test(html);

      if (!plainText && !hasInlineImages) {
        showFormError("Discussion description is required.");
        return;
      }

      if (plainText.length > MAX_DESCRIPTION_CHARS) {
        showFormError(
          `Discussion description cannot exceed ${MAX_DESCRIPTION_CHARS.toLocaleString()} characters.`,
        );
        return;
      }

      if (
        mediaKind === "video" &&
        youtubeUrl.trim() &&
        !getYoutubeVideoId(youtubeUrl)
      ) {
        showFormError(t("invalidYoutubeLink"));
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        showFormError("You are not logged in. Please login first.");
        return;
      }

      setLoading(true);

      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("description", html);
      formData.append("categoryId", categoryId);

      if (mediaKind === "image" && image) {
        formData.append("image", image);
      }

      if (mediaKind === "video" && video) {
        formData.append("video", video);
      }

      formData.append(
        "youtubeUrl",
        mediaKind === "video" ? youtubeUrl.trim() : "",
      );

      if (removeExistingImage) {
        formData.append("removeImage", "true");
      }

      if (removeExistingVideo) {
        formData.append("removeVideo", "true");
      }

      if (removeExistingYoutube) {
        formData.append("removeYoutube", "true");
      }

      if (mediaKind === "document" && documentFile) {
        formData.append("document", documentFile);
      }

      if (removeExistingDocument) {
        formData.append("removeDocument", "true");
      }

      if (isEditMode && id) {
        await axios.put(`${API_URL}/discussions/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 180000,
        });

        setSuccess("Discussion updated successfully!");

        setTimeout(() => {
          navigate(`/discussion/${id}`);
        }, 800);

        return;
      }

      const response = await axios.post(`${API_URL}/discussions`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 180000,
      });

      setSuccess("Discussion started successfully!");

      const discussionId = response.data?.data?._id;

      setTimeout(() => {
        navigate(discussionId ? `/discussion/${discussionId}` : "/discussion");
      }, 800);
    } catch (error: any) {
      console.error("Discussion submit error:", error);

      if (error.response?.status === 401) {
        showFormError("Unauthorized. Please login again.");
      } else if (error.response?.data?.message) {
        showFormError(error.response.data.message);
      } else if (error.code === "ECONNABORTED") {
        showFormError("The upload timed out. Please try a smaller file.");
      } else {
        showFormError(
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
            <span className="visually-hidden">{t("loading")}</span>
          </div>

          <p className="text-muted mt-3">{t("loadingDiscussion")}</p>
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
          {t("home")}
        </a>

        <span className="mx-1 text-muted">&gt;</span>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();

            navigate("/discussion");
          }}
        >
          {t("discussions")}
        </a>

        <span className="mx-1 text-muted">&gt;</span>

        <span className="current">
          {isEditMode ? t("editDiscussion") : t("startDiscussion")}
        </span>
      </div>

      {/* ======================================
          TITLE
      ====================================== */}

      <h1 className="page-title mb-1">
        {isEditMode ? t("editDiscussion") : t("startNewDiscussion")}
      </h1>

      <p className="page-subtitle mb-4">
        {isEditMode
          ? t("updateDiscussionDetails")
          : t("uploadDocHint")}
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
            {t("title")}
          </label>

          <input
            type="text"
            id="title"
            className="form-control"
            placeholder={t("titlePlaceholder")}
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
            {t("category")}
          </label>

          <select
            id="category"
            className="form-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={categoryLoading}
          >
            <option value="">
              {categoryLoading ? t("loadingCategories") : t("selectCategory")}
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
          <label className="field-label">{t("description")}</label>

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

              {editor?.isActive("image") && (
                <>
                  <button
                    type="button"
                    className={`editor-tool ${
                      editor.isActive("image", { align: "left" }) ? "active" : ""
                    }`}
                    title="Align image left"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes("image", { align: "left" })
                        .run()
                    }
                  >
                    <i className="bi bi-text-left"></i>
                  </button>
                  <button
                    type="button"
                    className={`editor-tool ${
                      editor.isActive("image", { align: "center" })
                        ? "active"
                        : ""
                    }`}
                    title="Align image center"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes("image", { align: "center" })
                        .run()
                    }
                  >
                    <i className="bi bi-text-center"></i>
                  </button>
                  <button
                    type="button"
                    className={`editor-tool ${
                      editor.isActive("image", { align: "right" })
                        ? "active"
                        : ""
                    }`}
                    title="Align image right"
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes("image", { align: "right" })
                        .run()
                    }
                  >
                    <i className="bi bi-text-right"></i>
                  </button>
                </>
              )}

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
            /{MAX_DESCRIPTION_CHARS.toLocaleString()}
          </div>
        </div>

        <MediaAttachSelect
          value={mediaKind}
          options={["image", "document", "video"]}
          onChange={handleMediaKindChange}
        />

        {mediaKind === "document" && (
          <div className="mb-4">
            <label className="field-label mb-2">
              {t("importFromDocument")}{" "}
              <span className="optional">{t("pdfDocDocx")}</span>
            </label>

            <label
              htmlFor="documentInput"
              className="upload-box"
              style={{
                cursor: importingDocument ? "wait" : "pointer",
                opacity: importingDocument ? 0.7 : 1,
              }}
            >
              <i className="bi bi-file-earmark-text d-block mb-2"></i>

              <div>
                {importingDocument
                  ? t("readingDocument")
                  : documentFile
                    ? documentFile.name
                    : existingDocument
                      ? existingDocumentName || t("currentDocument")
                      : t("dropDocument")}
              </div>

              {!documentFile && !existingDocument && !importingDocument && (
                <>
                  <div>
                    <span className="upload-link">{t("orClickBrowse")}</span>
                  </div>

                  <div className="upload-hint mt-1">
                    {t("documentFillHint")}
                  </div>
                </>
              )}

              <input
                type="file"
                id="documentInput"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="d-none"
                disabled={importingDocument}
                onChange={handleDocumentChange}
              />
            </label>

            {(documentFile || existingDocument) && !importingDocument && (
              <div className="mt-2">
                <small className="text-muted">
                  {t("imported", {
                    name: documentFile?.name || existingDocumentName || "",
                  })}
                </small>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={() => {
                    handleRemoveDocument();
                    setExistingDocument("");
                    setExistingDocumentName("");
                    setRemoveExistingDocument(true);
                  }}
                >
                  {t("remove")}
                </button>
              </div>
            )}
          </div>
        )}

        {mediaKind === "video" && (
          <VideoSourceFields
            inputId="videoInput"
            video={video}
            videoPreview={videoPreview}
            youtubeUrl={youtubeUrl}
            existingVideo={existingVideo}
            existingYoutubeUrl={existingYoutubeUrl}
            previewTitle={title}
            onVideoChange={handleVideoFileChange}
            onYoutubeChange={handleYoutubeUrlChange}
            onRemoveExistingVideo={handleRemoveExistingVideo}
            onRemoveExistingYoutube={handleRemoveExistingYoutube}
            onError={setError}
          />
        )}

        {mediaKind === "image" && (
          <ImageSourceFields
            inputId="fileInput"
            image={image}
            existingImage={existingImage}
            onImageChange={(file) => {
              setError("");
              setImage(file);
              setRemoveExistingImage(false);
            }}
            onRemoveExistingImage={handleRemoveExistingImage}
            onError={setError}
          />
        )}

        {/* ====================================
            ACTION BUTTONS
        ==================================== */}

        {error && (
          <div id="discussion-form-error" className="alert alert-danger">
            {error}
          </div>
        )}

        {success && <div className="alert alert-success">{success}</div>}

        <div className="d-flex justify-content-end gap-2 action-row">
          <button
            type="button"
            className="btn btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            {t("cancel")}
          </button>

          <button
            type="submit"
            className="btn btn-brand"
            disabled={loading || importingDocument}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>

                {isEditMode ? t("updating") : t("starting")}
              </>
            ) : isEditMode ? (
              t("updateDiscussion")
            ) : (
              t("submit")
            )}
          </button>
        </div>
      </form>
    </main>
  );
};

export default StartDiscussion;
