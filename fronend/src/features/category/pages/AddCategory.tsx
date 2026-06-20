// features/category/pages/AddCategory.tsx

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { addCategoryApi, getCategoriesApi } from "../categoryApi";
import type { Category } from "../types";

import "./AddCategory.css";

export default function AddCategory() {
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const loadCategories = async () => {
    try {
      const res = await getCategoriesApi();
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await addCategoryApi({ name });

      // Clear input
      setName("");

      // Reload category list
      await loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add category");
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
            className="btn btn-primary btn-lg"
            style={{
              width: "180px",
              fontSize: "14px",
            }}
          >
            {loading ? "Adding..." : "Add Category"}
          </button>
        </div>
      </div>

      <div className="categorylistcontainer">
        {categories.length === 0 ? (
          <div className="listItem">
            <span>No categories found</span>
          </div>
        ) : (
          categories.map((category) => (
            <div className="listItem" key={category._id}>
              <span>{category.name}</span>
              <i className="fa-solid fa-trash"></i>
            </div>
          ))
        )}
      </div>

      {error && <p className="text-danger mt-3">{error}</p>}
    </form>
  );
}
