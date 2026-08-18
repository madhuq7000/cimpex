// features/category/categoryApi.ts
import api from "../../core/api/axios";

export const getCategoriesApi = () =>
  api.get("/categories");

export const addCategoryApi = (data: { name: string }) =>
  api.post("/categories", data);

export const updateCategoryApi = (id: string, data: { name: string }) =>
  api.put(`/categories/${id}`, data);

export const deleteCategoryApi = (id: string) =>
  api.delete(`/categories/${id}`);