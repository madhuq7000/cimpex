import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ProductCard from "./components/ProductCard";
import { getProductsApi, getProductsByCategoryApi } from "../productApi";

import type { Product } from "../types";

const ProductList: React.FC = () => {
  const { name } = useParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let res;

        if (name) {
          console.log("Fetching category:", name);
          res = await getProductsByCategoryApi(name);
        } else {
          console.log("Fetching all products");
          res = await getProductsApi();
        }

        setProducts(res.data);
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [name]);

  const handleAddToCart = (product: Product) => {
    const updatedCart = [...cart, product];
    setCart(updatedCart);

    console.log("Cart:", updatedCart);
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
