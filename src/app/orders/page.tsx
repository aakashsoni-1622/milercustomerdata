import React from 'react';
import OrdersTableV2 from '@/components/OrdersTableV2';

const OrdersPage = () => {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
      <OrdersTableV2 />
    </main>
  );
};

export default OrdersPage; 