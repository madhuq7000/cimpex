// src/features/category/pages/AddCategory.tsx

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import {
  addCategoryApi,
  getCategoriesApi,
  deleteCategoryApi,
  updateCategoryApi,
} from "../categoryApi";

import type { Category } from "../types";
import { useLanguage } from "../../../core/context/LanguageContext";

import "./AddCategory.css";

export default function AddCategory() {
  const { t } = useLanguage();
  // ==========================================
  // STATES
  // ==========================================

  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);

  const [loadingCategories, setLoadingCategories] = useState(true);

  const [error, setError] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);

    if (error) {
      setError("");
    }
  };

  // ==========================================
  // LOAD CATEGORIES
  // ==========================================

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);

      const res = await getCategoriesApi();

      console.log("Categories response:", res.data);

      setCategories(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to load categories:", err);

      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // ==========================================
  // LOAD ON PAGE START
  // ==========================================

  useEffect(() => {
    loadCategories();
  }, []);

  // ==========================================
  // EDIT CATEGORY
  // ==========================================

  const handleEdit = (category: Category) => {
    setEditingId(category._id);

    setName(category.name);

    setError("");

    // Move user to top of form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    setEditingId(null);

    setName("");

    setError("");
  };

  // ==========================================
  // DELETE CATEGORY
  // ==========================================

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCategoryApi(id);

      // Refresh category list
      await loadCategories();

      // If currently editing same category
      if (editingId === id) {
        setEditingId(null);

        setName("");
      }
    } catch (err: any) {
      console.error("Delete category error:", err);

      alert(err.response?.data?.message || "Failed to delete category");
    }
  };

  // ==========================================
  // ADD / UPDATE CATEGORY
  // ==========================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ========================================
    // VALIDATION
    // ========================================

    if (!name.trim()) {
      setError("Category name is required");

      return;
    }

    try {
      setLoading(true);

      setError("");

      // ========================================
      // UPDATE CATEGORY
      // ========================================

      if (editingId) {
        await updateCategoryApi(editingId, {
          name: name.trim(),
        });
      }

      // ========================================
      // ADD CATEGORY
      // ========================================
      else {
        await addCategoryApi({
          name: name.trim(),
        });
      }

      // ========================================
      // RESET FORM
      // ========================================

      setName("");

      setEditingId(null);

      // ========================================
      // REFRESH CATEGORY LIST
      // ========================================

      await loadCategories();
    } catch (err: any) {
      console.error("Category submit error:", err);

      setError(
        err.response?.data?.message ||
          (editingId ? "Failed to update category" : "Failed to add category"),
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <form onSubmit={handleSubmit}>
      {/* ======================================
          ADD / EDIT CATEGORY
      ====================================== */}

      <div className="category-form-section">
        <div className="inputrow">
          <input
            type="text"
            className="form-control"
            placeholder={t("categoryName")}
            value={name}
            onChange={handleChange}
          />

          {/* ADD / UPDATE BUTTON */}

          <button
            type="submit"
            className="btn btn-primary add-category-btn"
            disabled={loading}
          >
            {loading
              ? editingId
                ? t("updating")
                : t("adding")
              : editingId
                ? t("updateCategory")
                : t("addCategory")}
          </button>

          {/* CANCEL EDIT BUTTON */}

          {editingId && (
            <button
              type="button"
              className="btn btn-cancel ms-2"
              onClick={handleCancelEdit}
              disabled={loading}
            >
              {t("cancel")}
            </button>
          )}
        </div>

        {/* ERROR */}

        {error && <p className="text-danger mt-2">{error}</p>}
      </div>

      {/* ======================================
          CATEGORY LIST
      ====================================== */}

      <div className="categorylistcontainer">
        {/* LOADING */}

        {loadingCategories ? (
          <div className="listItem">
            <span>{t("loading")}</span>
          </div>
        ) : categories.length === 0 ? (
          /* NO CATEGORY */

          <div className="listItem">
            <span>{t("noCategoriesFound")}</span>
          </div>
        ) : (
          /* CATEGORY LIST */

          categories.map((category) => (
            <div className="listItem" key={category._id}>
              {/* CATEGORY NAME */}

              <span>{category.name}</span>

              {/* ACTION BUTTONS */}

              <div className="d-flex align-items-center gap-3">
                {/* EDIT */}

                <button
                  type="button"
                  className="btn p-0 border-0 bg-transparent"
                  title={t("editCategory")}
                  onClick={() => handleEdit(category)}
                >
                  <i
                    className="bi bi-pencil-square text-primary"
                    style={{
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  ></i>
                </button>

                {/* DELETE */}

                <button
                  type="button"
                  className="btn p-0 border-0 bg-transparent"
                  title={t("deleteCategory")}
                  onClick={() => handleDelete(category._id)}
                >
                  <i
                    className="bi bi-trash-fill text-danger"
                    style={{
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  ></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </form>
  );
}
