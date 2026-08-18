// features/auth/authApi.ts
import api from "../../core/api/axios";
import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
} from "./types";

export const loginApi = (data: LoginPayload) => {
  return api.post<AuthResponse>("/auth/login", data);
};

export const registerApi = (data: RegisterPayload) => {
  return api.post("/auth/register", data);
};