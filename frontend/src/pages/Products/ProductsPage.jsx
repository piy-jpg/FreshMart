import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { ProductGrid } from '../../components/products/ProductGrid';
import { SearchBar } from '../../components/common/SearchBar';

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    productService.getAll().then(setProducts);
  }, []);

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-stone-900">All Farm Produce</h1>
        <div className="w-72"><SearchBar value={search} onChange={setSearch} /></div>
      </div>
      <ProductGrid products={filtered} />
    </div>
  );
}
