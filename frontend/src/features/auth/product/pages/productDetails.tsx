// features/auth/product/pages/ProductDetails.tsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getProductByIdApi } from "../productApi";
import type { Product } from "../types";
import "./productDetails.css";

export default function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState<Product | null>(null);

  // ✅ selected large image
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    if (id) {
      getProductByIdApi(id).then((res) => {
        const productData = res.data;

        setProduct(productData);

        // ✅ default first image
        if (productData.images?.length > 0) {
          setSelectedImage(productData.images[0]);
        }
      });
    }
  }, [id]);

  if (!product) {
    return (
      <div className="container py-5">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="detailContainer">
      {/* ========================= */}
      {/* LEFT SIDE - IMAGE GALLERY */}
      {/* ========================= */}
      <div className="leftDetails">
        {/* LARGE IMAGE */}
        <div className="bigImage mb-3">
          <img
            src={`http://localhost:3000/uploads/${selectedImage}`}
            alt={product.name}
            className="img-fluid rounded"
          />
        </div>

        {/* THUMBNAILS */}
        <div className="d-flex gap-2 flex-wrap">
          {product.images?.map((img, index) => (
            <div
              key={index}
              onClick={() => setSelectedImage(img)}
              className={`border rounded overflow-hidden ${
                selectedImage === img
                  ? "border-primary border-3"
                  : "border-secondary"
              }`}
              style={{
                width: "90px",
                height: "90px",
                cursor: "pointer",
              }}
            >
              <img
                src={`http://localhost:3000/uploads/${img}`}
                alt={`thumb-${index}`}
                className="w-100 h-100"
                style={{
                  objectFit: "cover",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ========================= */}
      {/* RIGHT SIDE - PRODUCT INFO */}
      {/* ========================= */}
      <div className="rightDetails">
        {/* PRODUCT NAME */}
        <h3 className="mb-3">{product.name}</h3>

        {/* PRICE */}
        <h3 className="text-success mb-4">₹ {product.price}</h3>

        {/* DESCRIPTION */}
        <div className="mb-4">
          <h4>Description</h4>

          <p className="text-muted">{product.description}</p>
        </div>

        {/* BUTTONS */}
        <div className="d-flex gap-3">
          <button className="btn btn-primary btn-lg">Add To Cart</button>

          <button className="btn btn-outline-dark btn-lg">Buy Now</button>
        </div>
      </div>
    </div>
  );
}
