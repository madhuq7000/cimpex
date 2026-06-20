import { useEffect, useState } from "react";
import type { ProductPayload } from "../../types";
import type { Category } from "../../../../category/types";
import { getCategoriesApi } from "../../../../category/categoryApi";

interface Props {
  initialData: ProductPayload;

  // ✅ changed here
  onSubmit: (data: FormData) => void;

  loading: boolean;
}

export default function ProductForm({ initialData, onSubmit, loading }: Props) {
  const [form, setForm] = useState<ProductPayload>(initialData);
  const [categories, setCategories] = useState<Category[]>([]);

  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    getCategoriesApi().then((res) => setCategories(res.data));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === "price" ? Number(value) : value,
    });
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setImages((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form
      className="shadow-sm border-0"
      style={{ width: "400px" }}
      onSubmit={(e) => {
        e.preventDefault();

        const formData = new FormData();

        formData.append("name", form.name);
        formData.append("price", String(form.price));
        formData.append("description", form.description);
        formData.append("categoryId", form.categoryId);
        formData.append("strikeprice", String(form.strikeprice));
        formData.append("starrating", String(form.starrating));

        images.forEach((file) => {
          formData.append("images", file);
        });

        onSubmit(formData);
      }}
    >
      <div className="">
        {/* Product Name */}
        <div className="mb-3">
          <label className="form-label">Product Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            placeholder="Enter Product Name"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        {/* Category */}
        <div className="mb-3">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            className="form-control"
            name="price"
            placeholder="0.00"
            value={form.price}
            onChange={handleChange}
          />
        </div>

        {/* Strike Price */}
        <div className="mb-3">
          <label className="form-label">Strike Price</label>
          <input
            type="number"
            className="form-control"
            name="strikeprice"
            placeholder="0.00"
            value={form.strikeprice}
            onChange={handleChange}
          />
        </div>

        {/* Rating */}
        <div className="mb-3">
          <label className="form-label">Star Rating</label>
          <input
            type="number"
            className="form-control"
            name="starrating"
            min="1"
            max="5"
            placeholder="1-5"
            value={form.starrating}
            onChange={handleChange}
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={4}
            name="description"
            placeholder="Enter Product Description"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        {/* Images */}
        <div className="mb-3">
          <label className="form-label fw-bold">Product Images</label>

          <div className="d-flex flex-wrap gap-3 mb-3">
            {images.map((file, index) => (
              <div
                key={index}
                className="position-relative border rounded"
                style={{ width: "120px", height: "120px" }}
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-100 h-100"
                  style={{ objectFit: "cover" }}
                />

                <button
                  type="button"
                  className="btn btn-danger btn-sm position-absolute top-0 end-0"
                  onClick={() => handleRemoveImage(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <label className="btn btn-outline-primary">
            <i className="fa-solid fa-image me-2"></i>
            Add Images
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleAddImage}
            />
          </label>
        </div>
      </div>

      <div className="card-footer text-end bg-white">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}
