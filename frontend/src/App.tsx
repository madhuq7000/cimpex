// App.tsx
import AppRouter from "./app/router";
import { AuthProvider } from "./core/context/AuthContext";
import { LanguageProvider } from "./core/context/LanguageContext";

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </LanguageProvider>
  );
}
