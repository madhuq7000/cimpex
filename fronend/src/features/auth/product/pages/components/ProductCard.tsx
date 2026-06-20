import React from "react";
import type { Product } from "../../types";
import { Link } from "react-router-dom";
import "./ProductCard.css";

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard: React.FC<Props> = ({ product, onAdd }) => {
  return (
    <div className="product-card">
      <img
        src={
          product.images?.length
            ? `http://localhost:3000/uploads/${product.images[0]}`
            : "https://via.placeholder.com/200"
        }
        // src={
        //   product.images?.length
        //     ? `https://fastly.picsum.photos/id/893/300/250.jpg?hmac=aIE36PIBIuarQf1Xmh4xtZ5rPgx41ykHgOinX8KGTi8`
        //     : "https://fastly.picsum.photos/id/893/300/250.jpg?hmac=aIE36PIBIuarQf1Xmh4xtZ5rPgx41ykHgOinX8KGTi8"
        // }
        className="card-img-top"
        alt={product.name}
        style={{ height: "200px", objectFit: "cover" }}
      />

      <div className="productInfo">
        <div className="card-title">{product.name}</div>
        <div className="text-muted">{product.description}</div>
        <div className="text-success">₹ {product.price}</div>
        <div className="rating">⭐ 4.8 (87)</div>
        <div className="price">
          $16.25 <span>$24.25</span>
        </div>

        <div className="d-flex justify-content-between gapdata">
          <Link
            to={`/products/${product._id}`}
            className="btn btn-outline-primary btn-sm"
          >
            Details
          </Link>

          <button
            className="btn btn-success btn-sm"
            onClick={() => onAdd(product)}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
