// features/product/pages/EditProduct.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getProductByIdApi, updateProductApi } from "../productApi";
import type { ProductPayload } from "../types";
import ProductForm from "./components/ProductForm";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductPayload | null>(null);

  useEffect(() => {
    if (id) {
      getProductByIdApi(id).then((res) => setData(res.data));
    }
  }, [id]);

  const handleSubmit = async (form: ProductPayload) => {
    if (!id) return;

    try {
      setLoading(true);
      await updateProductApi(id, form);
      //navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <p>Loading...</p>;

  return (
    <ProductForm initialData={data} onSubmit={handleSubmit} loading={loading} />
  );
}
