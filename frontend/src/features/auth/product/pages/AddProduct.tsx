// features/product/pages/AddProduct.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { addProductApi } from "../productApi";
import ProductForm from "./components/ProductForm";

export default function AddProduct() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      await addProductApi(data);

      navigate("/product-list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductForm
      initialData={{
        name: "",
        price: 0,
        description: "",
        categoryId: "",
        strikeprice: 0,
        starrating: 0,
      }}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}
