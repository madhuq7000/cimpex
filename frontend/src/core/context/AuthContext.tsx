// core/context/AuthContext.tsx

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import { getStoredUser } from "../utils/superAdmin";

interface AuthUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  profileImage?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (token: string, user?: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("token"),
  );
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const login = (token: string, nextUser?: AuthUser | null) => {
    localStorage.setItem("token", token);

    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
    } else {
      setUser(getStoredUser());
    }

    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
