import React, { useEffect, useState } from "react";
import ProductCard from "./components/ProductCard";
import { getProductsApi } from "../productApi";
import type { Product } from "../types";

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getProductsApi(); // ✅ FIXED
        setProducts(res.data); // ⚠️ adjust if API wraps response
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
    console.log("Cart:", [...cart, product]);
  };

  if (loading) {
    return <h5 className="text-center mt-5">Loading...</h5>;
  }

  return (
    <>
      {products.length === 0 ? (
        <p className="text-center">No products found</p>
      ) : (
        products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onAdd={handleAddToCart}
          />
        ))
      )}
    </>
  );
};

export default ProductList;
