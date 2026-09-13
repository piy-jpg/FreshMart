import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { ProductGrid } from '../../components/products/ProductGrid';
import { CategoryCard } from '../../components/products/CategoryCard';
import { Loader } from '../../components/common/Loader';

export function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    productService.getAll()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { key: 'all', label: 'All Items', icon: '🥬' },
    { key: 'vegetables', label: 'Vegetables', icon: '🥦' },
    { key: 'fruits', label: 'Fruits', icon: '🍎' },
    { key: 'herbs', label: 'Herbs', icon: '🌿' }
  ];

  const filtered = activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-8">
      <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-lg">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950">
            ⚡ 90-Minute Express Delivery
          </span>
          <h1 className="text-3xl sm:text-4xl font-black">Direct from Farm to Your Kitchen</h1>
          <p className="text-xs text-emerald-200">100% certified residue-free vegetables & seasonal harvest.</p>
        </div>
        <span className="text-6xl sm:text-7xl">🥦🌽🍅</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map(c => (
          <CategoryCard key={c.key} label={c.label} icon={c.icon} active={activeCategory === c.key} onClick={() => setActiveCategory(c.key)} />
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-4">Today's Dawn Harvest ({filtered.length})</h2>
        {loading ? <Loader /> : <ProductGrid products={filtered} />}
      </div>
    </div>
  );
}
