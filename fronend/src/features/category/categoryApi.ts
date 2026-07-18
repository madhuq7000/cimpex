// features/category/categoryApi.ts
import api from "../../core/api/axios";

export const getCategoriesApi = () =>
  api.get("/categories");

export const addCategoryApi = (data: { name: string }) =>
  api.post("/categories", data);