import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";

import ProtectedRoute from "../core/guards/ProtectedRoute";

import AddProduct from "../features/auth/product/pages/AddProduct";
import EditProduct from "../features/auth/product/pages/EditProduct";
import ProductList from "../features/auth/product/pages/ProductList";
import ProductDetails from "../features/auth/product/pages/productDetails";

import AddCategory from "../features/category/pages/AddCategory";
import Discussion from "../features/auth/discussion/discussion";
import DiscussionDetails from "../features/auth/discussion/discussiondetails";
import StartDiscussion from "../features/auth/discussion/startDiscussion";

const Dashboard = () => <h1>Dashboard</h1>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/product-list" element={<ProductList />} />
          <Route path="/product-list/:name" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetails />} />

          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/edit-product/:id" element={<EditProduct />} />
          <Route path="/add-category" element={<AddCategory />} />
          <Route path="/discussion" element={<Discussion />} />
          <Route path="/discussion/:id" element={<DiscussionDetails />} />
          <Route path="/start-discussion" element={<StartDiscussion />} />
          <Route path="/discussion/edit/:id" element={<StartDiscussion />} />
        </Route>

        {/* Default Route */}
        <Route path="/" element={<Login />} />

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
