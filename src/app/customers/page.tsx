import React from 'react';
import CustomersTable from '@/components/CustomersTable';

const CustomersPage = () => {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Customers Management</h1>
      <CustomersTable />
    </main>
  );
};

export default CustomersPage; 