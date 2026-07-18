// App.tsx
import AppRouter from "./app/router";
import { AuthProvider } from "./core/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
