import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { ProductDetails } from '../../components/products/ProductDetails';

export function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    productService.getById(id).then(setProduct);
  }, [id]);

  return <ProductDetails product={product} />;
}
