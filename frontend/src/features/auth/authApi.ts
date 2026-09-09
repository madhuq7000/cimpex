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

export const forgotPasswordApi = (data: { email: string }) => {
  return api.post<{
    success: boolean;
    message: string;
    resetToken?: string;
  }>("/auth/forgot-password", data);
};

export const resetPasswordApi = (data: { token: string; password: string }) => {
  return api.post<{
    success: boolean;
    message: string;
  }>("/auth/reset-password", data);
};

export const getMeApi = () => {
  return api.get<{
    success: boolean;
    user: AuthResponse["user"];
  }>("/auth/me");
};