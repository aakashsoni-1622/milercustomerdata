import React from 'react';
import OrdersTable from '@/components/OrdersTable';

const OrdersPage = () => {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
      <OrdersTable />
    </main>
  );
};

export default OrdersPage; 