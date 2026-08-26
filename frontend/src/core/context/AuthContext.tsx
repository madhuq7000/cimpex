// core/context/AuthContext.tsx

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ==========================================
  // AUTH STATE
  // ==========================================

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("token"),
  );

  // ==========================================
  // LOGIN
  // ==========================================

  const login = (token: string) => {
    localStorage.setItem("token", token);

    setIsAuthenticated(true);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    // Remove JWT token
    localStorage.removeItem("token");

    // Remove logged-in user information
    localStorage.removeItem("user");

    // Update React authentication state
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// CUSTOM AUTH HOOK
// ==========================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
