import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";

import ProtectedRoute from "../core/guards/ProtectedRoute";

import AddProduct from "../features/auth/product/pages/AddProduct";
import EditProduct from "../features/auth/product/pages/EditProduct";
import ProductList from "../features/auth/product/pages/ProductList";

import AddCategory from "../features/category/pages/AddCategory";

import ProductDetails from "../features/auth/product/pages/productDetails";

const Dashboard = () => <h1>Dashboard</h1>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================= */}
        {/* PUBLIC ROUTES WITHOUT LAYOUT */}
        {/* ========================= */}

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* ========================= */}
        {/* ROUTES WITH HEADER/FOOTER */}
        {/* ========================= */}

        <Route element={<MainLayout />}>
          {/* PUBLIC */}
          <Route path="/product-list" element={<ProductList />} />

          <Route path="/products/:id" element={<ProductDetails />} />

          {/* PROTECTED */}

          <Route
            path="/add-product"
            element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-product/:id"
            element={
              <ProtectedRoute>
                <EditProduct />
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ========================= */}
        {/* FALLBACK */}
        {/* ========================= */}

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
