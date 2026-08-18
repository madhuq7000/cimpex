import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Header from "../sharedComponent/Header";
import Footer from "../sharedComponent/Footer";
import WhatsAppFloat from "../sharedComponent/WhatsAppFloat";

import "./MainLayout.css";
import type { Category } from "../features/category/types";
import { getCategoriesApi } from "../features/category/categoryApi";

const MainLayout: React.FC = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
  const cartCount = cartItems.length;

  const location = useLocation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategoriesApi();
        setCategories(res.data.data);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };

    loadCategories();
  }, []);

  // Keep sidebar selection in sync with URL
  useEffect(() => {
    if (location.pathname === "/product-list") {
      setSelectedCategory("All");
    } else if (location.pathname.startsWith("/product-list/")) {
      const category = decodeURIComponent(
        location.pathname.replace("/product-list/", ""),
      );
      setSelectedCategory(category);
    }
  }, [location.pathname]);

  let contentClass = "product-grid";

  if (
    location.pathname === "/add-category" ||
    location.pathname === "/add-product" ||
    location.pathname.startsWith("/products/") ||
    location.pathname === "/product"
  ) {
    contentClass = "page-layout";
  }

  const handleCategoryClick = (path: string, categoryName: string = "All") => {
    setSearchKeyword("");
    setSelectedCategory(categoryName);
    navigate(path);
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">Cimpex</div>

        <div className="product-count">
          <h6>Categories ({categories.length})</h6>
        </div>

        <ul className="menu">
          <li
            className={selectedCategory === "All" ? "active" : ""}
            onClick={() => handleCategoryClick("/product-list", "All")}
            style={{ cursor: "pointer" }}
          >
            All
          </li>

          {categories.length === 0 ? (
            <li>Loading...</li>
          ) : (
            categories.map((category) => (
              <li
                key={category._id}
                className={selectedCategory === category.name ? "active" : ""}
                onClick={() =>
                  handleCategoryClick(
                    `/product-list/${encodeURIComponent(category.name)}`,
                    category.name,
                  )
                }
                style={{ cursor: "pointer" }}
              >
                {category.name}
              </li>
            ))
          )}
        </ul>
      </aside>

      <main className="productcontent">
        <Header
          cartCount={cartCount}
          search={searchKeyword}
          onSearch={setSearchKeyword}
        />

        <div className={contentClass}>
          <Outlet
            context={{
              searchKeyword,
              setSelectedCategory,
            }}
          />
        </div>

        <Footer />
      </main>

      <WhatsAppFloat />
    </div>
  );
};

export default MainLayout;
