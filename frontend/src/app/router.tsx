import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";

import ProtectedRoute from "../core/guards/ProtectedRoute";

import AddCategory from "../features/category/pages/AddCategory";
import Discussion from "../features/auth/discussion/discussion";
import DiscussionDetails from "../features/auth/discussion/discussiondetails";
import StartDiscussion from "../features/auth/discussion/startDiscussion";

const Dashboard = () => <h1>Dashboard</h1>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ======================================
            LOGIN / REGISTER
        ====================================== */}

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* ======================================
            MAIN LAYOUT
            PUBLIC
        ====================================== */}

        <Route element={<MainLayout />}>
          {/* ====================================
              PUBLIC ROUTES
          ==================================== */}

          <Route path="/discussion" element={<Discussion />} />

          <Route path="/discussion/:id" element={<DiscussionDetails />} />

          {/* ====================================
              PROTECTED ROUTES
          ==================================== */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-category"
            element={
              <ProtectedRoute>
                <AddCategory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/start-discussion"
            element={
              <ProtectedRoute>
                <StartDiscussion />
              </ProtectedRoute>
            }
          />

          <Route
            path="/discussion/edit/:id"
            element={
              <ProtectedRoute>
                <StartDiscussion />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ======================================
            DEFAULT
        ====================================== */}

        <Route path="/" element={<Discussion />} />

        {/* ======================================
            FALLBACK
        ====================================== */}

        <Route path="*" element={<Discussion />} />
      </Routes>
    </BrowserRouter>
  );
}
