import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import ResetPassword from "../features/auth/pages/ResetPassword";
import OAuthCallback from "../features/auth/pages/OAuthCallback";

import ProtectedRoute from "../core/guards/ProtectedRoute";

import AddCategory from "../features/category/pages/AddCategory";
import Discussion from "../features/auth/discussion/discussion";
import DiscussionDetails from "../features/auth/discussion/discussiondetails";
import StartDiscussion from "../features/auth/discussion/startDiscussion";
import CompetitionList from "../features/auth/competition/competitionList";
import CompetitionDetails from "../features/auth/competition/competitionDetails";
import StartCompetition from "../features/auth/competition/startCompetition";
import Faq from "../features/pages/Faq";
import CommunityGuidelines from "../features/pages/CommunityGuidelines";

const Dashboard = () => <h1>Dashboard</h1>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ======================================
            DEFAULT ROUTE
            / -> /discussion
        ====================================== */}

        <Route path="/" element={<Navigate to="/discussion" replace />} />

        {/* ======================================
            LOGIN / REGISTER
        ====================================== */}

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* ======================================
            MAIN LAYOUT
        ====================================== */}

        <Route element={<MainLayout />}>
          {/* ====================================
              PUBLIC ROUTES
          ==================================== */}

          <Route path="/discussion" element={<Discussion />} />

          <Route path="/discussion/:id" element={<DiscussionDetails />} />

          <Route path="/competitions" element={<CompetitionList />} />

          <Route path="/competitions/:id" element={<CompetitionDetails />} />

          <Route path="/faq" element={<Faq />} />

          <Route path="/community-guidelines" element={<CommunityGuidelines />} />

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

          <Route
            path="/start-competition"
            element={
              <ProtectedRoute>
                <StartCompetition />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ======================================
            FALLBACK
            INVALID URL -> /discussion
        ====================================== */}

        <Route path="*" element={<Navigate to="/discussion" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
