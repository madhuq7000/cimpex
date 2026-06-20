// features/auth/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../authApi";
import { useAuth } from "../../../core/context/AuthContext";
import type { LoginPayload } from "../types";
import "./Login.css"; // Import the CSS file for styling

export default function Login() {
  const [form, setForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await loginApi(form);
      login(res.data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="loginbg d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <div className="card" style={{ width: "350px" }}>
        <div className="cardTop">
          <h2 className="mb-4">Login</h2>
        </div>
        <div className="p-4">
          <form onSubmit={submit}>
            <div className="mb-3">
              <input
                className="form-control"
                name="email"
                placeholder="Email"
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <input
                className="form-control"
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
              />
            </div>

            <div className="d-grid">
              <button className="btn btn-primary" type="submit">
                {loading ? "Logging..." : "Login"}
              </button>
            </div>

            {error && <p className="text-danger mt-3">{error}</p>}

            <p
              className="mt-3 text-center"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/register")}
            >
              Create account
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
