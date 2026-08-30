// features/auth/authApi.ts

import api from "../../core/api/axios";

import type {
  LoginPayload,
  AuthResponse,
} from "./types";

// ==========================================
// LOGIN
// ==========================================

export const loginApi = (data: LoginPayload) => {
  return api.post<AuthResponse>(
    "/auth/login",
    data,
  );
};

// ==========================================
// REGISTER
// ==========================================

export const registerApi = (data: FormData) => {
  return api.post<AuthResponse>(
    "/auth/register",
    data,
  );
};