// features/product/productApi.ts
import api from "../../../core/api/axios";

// export const addProductApi = (data: ProductPayload) =>
//   api.post("/products", data);

export const addProductApi = (data: FormData) => {
  return api.post("/products/add-product", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateProductApi = (id: string, data: FormData) =>
  api.put(`/products/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  // ==============================
// 📌 GET ALL PRODUCTS (NEW)
// ==============================
export const getProductsApi = () => {
  return api.get("/products");
};

// ==============================
// 📌 GET PRODUCTS BY CATEGORY
// ==============================
export const getProductsByCategoryApi = (categoryName: string) => {
  return api.get(`/products/category/${categoryName}`);
};

export const searchProductsApi = (keyword: string) => {
  return api.get(`/products/search?keyword=${keyword}`);
};
export const getProductByIdApi = (id: string) =>
  api.get(`/products/${id}`);


