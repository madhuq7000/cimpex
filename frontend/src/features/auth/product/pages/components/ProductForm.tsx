import { useEffect, useState } from "react";
import type { ProductPayload } from "../../types";
import type { Category } from "../../../../category/types";
import { getCategoriesApi } from "../../../../category/categoryApi";

interface Props {
  initialData: ProductPayload & {
    images?: string[];
  };
  onSubmit: (data: FormData) => void;
  loading: boolean;
}

export default function ProductForm({ initialData, onSubmit, loading }: Props) {
  const [form, setForm] = useState(initialData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    initialData.images || [],
  );
  //const user = JSON.parse(localStorage.getItem("user") || "{}");
  //console.log("addProduct user:", user);
  useEffect(() => {
    getCategoriesApi().then((res) => setCategories(res.data.data));
  }, []);

  // Logged-in user
  const user: {
    id?: string;
    name?: string;
    email?: string;
  } = JSON.parse(localStorage.getItem("user") || "{}");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]:
        name === "price" || name === "strikeprice" || name === "starrating"
          ? Number(value)
          : value,
    });
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setImages((prev) => [...prev, ...Array.from(files)]);
  };

  const handleRemoveNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form
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
        formData.append("uploadedBy", user.email || "");
        formData.append("uploadedById", user.id || "");
        formData.append("uploadedByName", user.name || "");
        formData.append("uploadedByEmail", user.email || "");

        formData.append("existingImages", JSON.stringify(existingImages));

        images.forEach((file) => {
          formData.append("images", file);
        });

        onSubmit(formData);
      }}
    >
      <div className="mb-3">
        <label className="form-label">Product Name</label>
        <input
          type="text"
          className="form-control"
          name="name"
          value={form.name}
          onChange={handleChange}
        />
      </div>

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

      <div className="mb-3">
        <label className="form-label">Price</label>
        <input
          type="number"
          className="form-control"
          name="price"
          value={form.price}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Strike Price</label>
        <input
          type="number"
          className="form-control"
          name="strikeprice"
          value={form.strikeprice}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Star Rating</label>
        <input
          type="number"
          className="form-control"
          name="starrating"
          min="1"
          max="5"
          value={form.starrating}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Description</label>
        <textarea
          className="form-control"
          rows={4}
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Product Images</label>

        <div className="d-flex flex-wrap gap-3 mb-3">
          {existingImages.map((img, index) => (
            <div
              key={`existing-${index}`}
              className="position-relative border rounded"
              style={{ width: "120px", height: "120px" }}
            >
              <img
                src={`http://localhost:3000/uploads/${img}`}
                alt="product"
                className="w-100 h-100"
                style={{ objectFit: "cover" }}
              />

              <button
                type="button"
                className="btn btn-danger btn-sm position-absolute top-0 end-0"
                onClick={() => handleRemoveExistingImage(index)}
              >
                ×
              </button>
            </div>
          ))}

          {images.map((file, index) => (
            <div
              key={`new-${index}`}
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
                onClick={() => handleRemoveNewImage(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <label className="btn btn-outline-primary">
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

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Saving..." : "Save Product"}
      </button>
    </form>
  );
}
