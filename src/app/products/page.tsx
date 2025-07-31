import React from 'react';
import ProductsTable from '@/components/ProductsTable';

const ProductsPage = () => {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Products Management</h1>
      <ProductsTable />
    </main>
  );
};

export default ProductsPage;