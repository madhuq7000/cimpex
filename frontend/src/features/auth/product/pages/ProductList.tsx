import React, { useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";

import ProductCard from "./components/ProductCard";
import {
  getProductsApi,
  getProductsByCategoryApi,
  searchProductsApi,
} from "../productApi";

import type { Product } from "../types";

type OutletContextType = {
  searchKeyword: string;
};

const ProductList: React.FC = () => {
  const { name } = useParams();

  const { searchKeyword } = useOutletContext<OutletContextType>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        let res;

        // Search products
        if (searchKeyword.trim().length >= 3) {
          console.log("Searching:", searchKeyword);
          res = await searchProductsApi(searchKeyword);
        }
        // Products by category
        else if (name) {
          console.log("Fetching category:", name);
          res = await getProductsByCategoryApi(name);
        }
        // All products
        else {
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

    fetchProducts();
  }, [name, searchKeyword]);

  const handleAddToCart = (product: Product) => {
    const updatedCart = [...cart, product];
    setCart(updatedCart);

    localStorage.setItem("cart", JSON.stringify(updatedCart));

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
