// features/product/types.ts
export interface ProductPayload {
  name: string;
  price: number;
  description: string;
  categoryId: string;
  images?: File[];
  strikeprice: number;
  starrating: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  strikeprice: number;
  starrating: number;
  images: string[];
  
}

export interface ProductEditPayload
  extends Omit<ProductPayload, "images"> {
  images?: string[];
}