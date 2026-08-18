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

import "./AddCategory.css";

export default function AddCategory() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);

    if (error) {
      setError("");
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);

      const res = await getCategoriesApi();

      setCategories(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEdit = (category: Category) => {
    setEditingId(category._id);
    setName(category.name);
    setError("");
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?",
    );

    if (!confirmed) return;

    try {
      await deleteCategoryApi(id);
      await loadCategories();

      if (editingId === id) {
        setEditingId(null);
        setName("");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete category");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (editingId) {
        await updateCategoryApi(editingId, {
          name: name.trim(),
        });
      } else {
        await addCategoryApi({
          name: name.trim(),
        });
      }

      setName("");
      setEditingId(null);

      await loadCategories();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (editingId ? "Failed to update category" : "Failed to add category"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="category-form-section">
        <div className="inputrow">
          <input
            type="text"
            className="form-control"
            placeholder="Category Name"
            value={name}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="btn btn-primary btn-lg add-category-btn"
            disabled={loading}
          >
            {loading
              ? editingId
                ? "Updating..."
                : "Adding..."
              : editingId
                ? "Update Category"
                : "Add Category"}
          </button>

          {editingId && (
            <button
              type="button"
              className="btn btn-secondary btn-lg ms-2"
              onClick={() => {
                setEditingId(null);
                setName("");
                setError("");
              }}
            >
              Cancel
            </button>
          )}
        </div>

        {error && <p className="text-danger mt-2">{error}</p>}
      </div>

      <div className="categorylistcontainer">
        {loadingCategories ? (
          <div className="listItem">
            <span>Loading...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="listItem">
            <span>No categories found</span>
          </div>
        ) : (
          categories.map((category) => (
            <div className="listItem" key={category._id}>
              <span>{category.name}</span>

              <div className="d-flex align-items-center gap-3">
                <i
                  className="fa-solid fa-pen-to-square text-primary"
                  title="Edit Category"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEdit(category)}
                ></i>

                <i
                  className="fa-solid fa-trash text-danger"
                  title="Delete Category"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleDelete(category._id)}
                ></i>
              </div>
            </div>
          ))
        )}
      </div>
    </form>
  );
}
