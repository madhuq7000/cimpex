// MainLayout.tsx

import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Header from "../sharedComponent/Header";
import Footer from "../sharedComponent/Footer";
import WhatsAppFloat from "../sharedComponent/WhatsAppFloat";

import "./MainLayout.css";
import type { Category } from "../features/category/types";
import { getCategoriesApi } from "../features/category/categoryApi";

const MainLayout: React.FC = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
  const cartCount: number = cartItems.length;

  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategoriesApi();
        setCategories(res.data);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };

    loadCategories();
  }, []);

  let contentClass = "product-grid";

  // Pages that should NOT use grid layout
  if (
    location.pathname === "/add-category" ||
    location.pathname === "/add-product" ||
    location.pathname.startsWith("/products/") ||
    location.pathname === "/product"
  ) {
    contentClass = "page-layout";
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">Cimpex</div>

        <div className="product-count">
          <h6>Categories ({categories.length})</h6>
        </div>

        <ul className="menu">
          {categories.length === 0 ? (
            <li>Loading...</li>
          ) : (
            categories.map((category, index) => (
              <li key={category._id} className={index === 0 ? "active" : ""}>
                {category.name}
              </li>
            ))
          )}
        </ul>
      </aside>

      <main className="productcontent">
        <Header cartCount={cartCount} />

        <div className={contentClass}>
          <Outlet />
        </div>

        <Footer />
      </main>

      <WhatsAppFloat />
    </div>
  );
};

export default MainLayout;
