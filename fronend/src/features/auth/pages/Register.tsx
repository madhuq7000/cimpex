// features/auth/pages/Register.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../authApi";
import type { RegisterPayload } from "../types";
import "./Register.css";

export default function Register() {
  const [form, setForm] = useState<RegisterPayload>({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    await registerApi(form);
    navigate("/login");
  };

  return (
    <div
      className="loginbg d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <div className="card" style={{ width: "350px" }}>
        <div className="cardTop">
          <h2 className="mb-4">Register</h2>
        </div>
        <div className="p-4">
          <form onSubmit={submit}>
            <div className="mb-3">
              <input
                className="form-control"
                name="name"
                placeholder="Name"
                onChange={handleChange}
              />
            </div>

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

            <div className="mb-3">
              <select
                className="form-control"
                name="role"
                onChange={handleChange}
              >
                <option value="">Select Role</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="d-grid">
              <button className="btn btn-primary" type="submit">
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
