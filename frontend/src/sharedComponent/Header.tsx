import { Link, useLocation } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";

type HeaderProps = {
  cartCount: number;
};

export default function Header({ cartCount }: HeaderProps) {
  const location = useLocation();

  const pageTitleMap: Record<string, string> = {
    "/add-category": "Add Category",
    "/edit-category": "Edit Category",
    "/add-product": "Add Product",
    "/cart": "product-list",
  };

  const pageTitle = pageTitleMap[location.pathname];

  return (
    <header className="topbar sticky-top">
      <div className="container d-flex justify-content-between align-items-center">
        <div>{pageTitle}</div>

        <div className="search-box">
          <i className="fa fa-search"></i>
          <input type="text" placeholder="Try for searching" />
        </div>

        <Link to="/cart" className="position-relative text-dark fs-4">
          <FaShoppingCart />

          {cartCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
