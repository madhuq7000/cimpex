import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaSignOutAlt } from "react-icons/fa";

type HeaderProps = {
  cartCount: number;
  search: string;
  onSearch: (keyword: string) => void;
};

export default function Header({ search, onSearch }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState(search);

  // Keep input synced when MainLayout clears it
  useEffect(() => {
    setSearchText(search);
  }, [search]);

  const pageTitleMap: Record<string, string> = {
    "/add-category": "Add Category",
    "/edit-category": "Edit Category",
    "/add-product": "Add Product",
    "/cart": "Product List",
  };

  const pageTitle = pageTitleMap[location.pathname];

  const handleSearch = () => {
    const keyword = searchText.trim();

    if (keyword.length < 3) return;

    // If currently inside a category, go back to All
    if (location.pathname.startsWith("/product-list/")) {
      navigate("/product-list");
    }

    onSearch(keyword);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  return (
    <header className="topbar sticky-top">
      <div className="container d-flex justify-content-between align-items-center">
        <div>{pageTitle}</div>

        <div className="search-box d-flex align-items-center">
          <input
            type="text"
            placeholder="Search products..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button className="btn btn-primary ms-2" onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>

        <button
          className="btn btn-outline-danger d-flex align-items-center gap-2"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </header>
  );
}
